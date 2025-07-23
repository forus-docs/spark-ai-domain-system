import { connectToDatabase } from '../app/lib/database';
import UserPost from '../app/models/UserPost';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function cleanupOrphanedUserPosts() {
  try {
    await connectToDatabase();
    
    console.log('🧹 Cleaning up orphaned UserPosts...\n');
    
    const userPosts = await UserPost.find({});
    let deleted = 0;
    let updated = 0;
    
    console.log(`Found ${userPosts.length} UserPosts to check\n`);
    
    for (const userPost of userPosts) {
      const masterPost = await Post.findById(userPost.postId);
      
      if (!masterPost) {
        // Post no longer exists, delete the UserPost
        await UserPost.deleteOne({ _id: userPost._id });
        deleted++;
        console.log(`❌ Deleted orphaned UserPost: ${userPost._id} (referenced non-existent post: ${userPost.postId})`);
      } else if (masterPost.processId && !userPost.processId) {
        // Post exists and has processId, but UserPost doesn't - update it
        userPost.processId = masterPost.processId;
        await userPost.save();
        updated++;
        console.log(`✅ Updated UserPost ${userPost._id} with processId: ${masterPost.processId}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Deleted ${deleted} orphaned UserPosts`);
    console.log(`Updated ${updated} UserPosts with missing processId`);
    
    // Final verification
    const remaining = await UserPost.countDocuments();
    const withProcessId = await UserPost.countDocuments({ processId: { $exists: true, $ne: null } });
    
    console.log(`\nRemaining UserPosts: ${remaining}`);
    console.log(`UserPosts with processId: ${withProcessId}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up UserPosts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOrphanedUserPosts();