import { connectToDatabase } from '../app/lib/database';
import User from '../app/models/User';
import UserPost from '../app/models/UserPost';
import Post from '../app/models/Post';
import { PostJourneyService } from '../app/lib/services/post-journey.service';
import mongoose from 'mongoose';

async function checkUserPosts() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Checking user posts...\n');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    // Get all posts
    const posts = await Post.find({ isActive: true });
    console.log(`Found ${posts.length} active posts\n`);

    // Check each user
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      
      // Get user's posts
      const userPosts = await UserPost.find({ userId: user._id.toString() });
      console.log(`  - Has ${userPosts.length} posts assigned`);
      
      // Check if user has identity verification post
      const identityPost = await Post.findOne({ 
        postType: 'identity_verification',
        isActive: true 
      });
      
      if (identityPost) {
        const hasIdentityPost = userPosts.some(up => up.postId === identityPost._id.toString());
        
        if (!hasIdentityPost) {
          console.log(`  ⚠️  Missing identity verification post - assigning now...`);
          
          await PostJourneyService.assignPost({
            userId: user._id.toString(),
            postId: identityPost._id.toString(),
            reason: 'manual_fix',
            assignedBy: 'system'
          });
          
          console.log(`  ✅ Identity verification post assigned`);
        } else {
          console.log(`  ✓ Has identity verification post`);
        }
      }
      
      // List user's posts
      if (userPosts.length > 0) {
        console.log(`  Posts:`);
        for (const userPost of userPosts) {
          const masterPost = await Post.findById(userPost.postId);
          if (masterPost) {
            console.log(`    - ${masterPost.title} (${userPost.isCompleted ? 'completed' : 'pending'})`);
          }
        }
      }
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error checking user posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the check
checkUserPosts();