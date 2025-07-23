import mongoose from 'mongoose';
import { connectToDatabase } from '../app/lib/database';

async function addProcessIdToUserPosts() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Get all UserPosts
    const userPosts = await mongoose.connection.db.collection('userposts').find({}).toArray();
    console.log(`Found ${userPosts.length} user posts to process`);

    // Get all Posts to get their processIds
    const posts = await mongoose.connection.db.collection('posts').find({}).toArray();
    const postProcessMap = new Map<string, string>();
    
    // Build a map of postId to processId
    posts.forEach(post => {
      if (post.processId) {
        postProcessMap.set(post._id.toString(), post.processId);
      }
    });

    console.log(`Found ${postProcessMap.size} posts with process IDs`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each UserPost with the processId from its referenced Post
    for (const userPost of userPosts) {
      const postId = userPost.postId;
      const processId = postProcessMap.get(postId);

      if (!processId) {
        console.log(`No processId found for userPost "${userPost.postSnapshot.title}" (postId: ${postId})`);
        skippedCount++;
        continue;
      }

      // Update the UserPost with the processId
      const result = await mongoose.connection.db.collection('userposts').updateOne(
        { _id: userPost._id },
        { $set: { processId: processId } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Updated userPost for user ${userPost.userId} - "${userPost.postSnapshot.title}" with processId: ${processId}`);
        updatedCount++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total user posts: ${userPosts.length}`);
    console.log(`User posts updated with process IDs: ${updatedCount}`);
    console.log(`User posts skipped (no process): ${skippedCount}`);

    // Verify the updates
    const updatedUserPosts = await mongoose.connection.db.collection('userposts')
      .find({ processId: { $exists: true } })
      .toArray();
    
    console.log(`\n--- Verification ---`);
    console.log(`User posts with processId set: ${updatedUserPosts.length}`);

  } catch (error) {
    console.error('Error adding processId to user posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
addProcessIdToUserPosts().catch(console.error);