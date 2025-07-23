import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import UserPost from '../app/models/UserPost';
import mongoose from 'mongoose';

async function fixMHXVerification() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Updating "Claim your MHX" post to require identity verification...\n');

    // Update the master post
    const result = await Post.findOneAndUpdate(
      { title: "Claim your MHX" },
      { $set: { requiresIdentityVerification: true } },
      { new: true }
    );

    if (!result) {
      console.log('❌ "Claim your MHX" post not found');
      return;
    }

    console.log('✅ Updated master post:');
    console.log(`   Title: ${result.title}`);
    console.log(`   Requires Identity Verification: ${result.requiresIdentityVerification}`);
    console.log(`   Process ID: ${result.processId}`);

    // Update all existing user posts with this post
    const userPostsUpdated = await UserPost.updateMany(
      { postId: result._id },
      { $set: { "postSnapshot.requiresIdentityVerification": true } }
    );

    console.log(`\n✅ Updated ${userPostsUpdated.modifiedCount} user posts with the new verification requirement`);

  } catch (error) {
    console.error('❌ Error updating post:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixMHXVerification();