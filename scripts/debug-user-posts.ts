import { connectToDatabase } from '../app/lib/database';
import User from '../app/models/User';
import UserPost from '../app/models/UserPost';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function debugUserPosts() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Debugging user posts for jacques.berg@forus.digital\n');

    // Find the user
    const user = await User.findOne({ email: 'jacques.berg@forus.digital' });
    if (!user) {
      console.log('❌ User not found with email: jacques.berg@forus.digital');
      
      // List all users
      const allUsers = await User.find({});
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u._id})`);
      });
      return;
    }

    console.log('✅ User found:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Identity Verified: ${user.identity?.isVerified || false}`);
    console.log(`  Domains: ${JSON.stringify(user.domains)}`);
    console.log(`  Current Domain: ${user.currentDomainId || 'None'}`);

    // Check user posts
    console.log('\n📮 Checking UserPost collection...');
    const userPosts = await UserPost.find({ userId: user._id.toString() });
    console.log(`Found ${userPosts.length} UserPost documents`);
    
    if (userPosts.length > 0) {
      for (const userPost of userPosts) {
        const masterPost = await Post.findById(userPost.postId);
        console.log(`\n  UserPost ${userPost._id}:`);
        console.log(`    - Post ID: ${userPost.postId}`);
        console.log(`    - Title: ${userPost.postSnapshot.title}`);
        console.log(`    - Hidden: ${userPost.isHidden}`);
        console.log(`    - Completed: ${userPost.isCompleted}`);
        console.log(`    - Assigned: ${userPost.assignedAt}`);
        if (masterPost) {
          console.log(`    - Master Post Domain: ${masterPost.domain}`);
          console.log(`    - Master Post Active: ${masterPost.isActive}`);
        } else {
          console.log(`    - ⚠️  Master post not found!`);
        }
      }
    }

    // Check master posts
    console.log('\n📚 Checking Post collection...');
    const totalPosts = await Post.countDocuments();
    const activePosts = await Post.countDocuments({ isActive: true });
    console.log(`Total posts: ${totalPosts}`);
    console.log(`Active posts: ${activePosts}`);
    
    // List all posts by domain
    const postsByDomain = await Post.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$domain', count: { $sum: 1 }, posts: { $push: '$title' } } }
    ]);
    
    console.log('\nPosts by domain:');
    postsByDomain.forEach(group => {
      console.log(`\n  ${group._id}: ${group.count} posts`);
      group.posts.forEach((title: string) => {
        console.log(`    - ${title}`);
      });
    });

    // Test the getUserPosts method
    console.log('\n🧪 Testing PostJourneyService.getUserPosts()...');
    const { PostJourneyService } = await import('../app/lib/services/post-journey.service');
    
    const posts = await PostJourneyService.getUserPosts(user._id.toString(), {
      includeHidden: true,
      includeCompleted: true
    });
    
    console.log(`\ngetUserPosts returned ${posts.length} posts`);
    posts.forEach(post => {
      console.log(`  - ${post.masterPost.title} (${post.masterPost.domain})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the debug script
debugUserPosts();