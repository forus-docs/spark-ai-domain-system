import mongoose from 'mongoose';
import { connectToDatabase } from '../app/lib/database';

async function linkConversationsToUserPosts() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Get all conversations
    const conversations = await mongoose.connection.db.collection('conversations').find({}).toArray();
    console.log(`Found ${conversations.length} conversations to process`);

    // Get all UserPosts to build a lookup map
    const userPosts = await mongoose.connection.db.collection('userposts').find({}).toArray();
    
    // Build a map: userId + processId -> userPostId
    // Note: This assumes one UserPost per user per process (most recent if multiple)
    const userPostMap = new Map<string, string>();
    
    userPosts.forEach(userPost => {
      if (userPost.processId) {
        const key = `${userPost.userId}_${userPost.processId}`;
        // If multiple UserPosts exist for same user/process, keep the most recent
        const existing = userPostMap.get(key);
        if (!existing || userPost.assignedAt > userPosts.find(up => up._id.toString() === existing)?.assignedAt) {
          userPostMap.set(key, userPost._id.toString());
        }
      }
    });

    console.log(`Built lookup map with ${userPostMap.size} user-process combinations`);

    let updatedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;

    // Update each conversation with the corresponding userPostId
    for (const conversation of conversations) {
      // Skip if no processId (can't link without it)
      if (!conversation.processId) {
        console.log(`Skipping conversation ${conversation.conversationId} - no processId`);
        skippedCount++;
        continue;
      }

      // Look up the UserPost
      const key = `${conversation.userId}_${conversation.processId}`;
      const userPostId = userPostMap.get(key);

      if (!userPostId) {
        console.log(`No matching UserPost found for conversation ${conversation.conversationId} (user: ${conversation.userId}, process: ${conversation.processId})`);
        noMatchCount++;
        continue;
      }

      // Update the conversation with the userPostId
      const result = await mongoose.connection.db.collection('conversations').updateOne(
        { _id: conversation._id },
        { $set: { userPostId: userPostId } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Updated conversation ${conversation.conversationId} with userPostId: ${userPostId}`);
        updatedCount++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total conversations: ${conversations.length}`);
    console.log(`Conversations updated with userPostId: ${updatedCount}`);
    console.log(`Conversations skipped (no processId): ${skippedCount}`);
    console.log(`Conversations with no matching UserPost: ${noMatchCount}`);

    // Verify the updates
    const updatedConversations = await mongoose.connection.db.collection('conversations')
      .find({ userPostId: { $exists: true } })
      .toArray();
    
    console.log(`\n--- Verification ---`);
    console.log(`Conversations with userPostId set: ${updatedConversations.length}`);
    
    // Show a sample of updated conversations
    const sample = updatedConversations.slice(0, 3);
    if (sample.length > 0) {
      console.log('\nSample updated conversations:');
      sample.forEach(conv => {
        console.log(`- ${conv.conversationId} → userPostId: ${conv.userPostId}`);
      });
    }

  } catch (error) {
    console.error('Error linking conversations to UserPosts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
linkConversationsToUserPosts().catch(console.error);