import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function verifyPostProcesses() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Verifying all posts with process-type CTAs have processId set...\n');

    // Get all posts with process-type CTA
    const processPosts = await Post.find({ 
      'ctaAction.type': 'process' 
    }).sort({ domain: 1, createdAt: 1 });

    if (processPosts.length === 0) {
      console.log('No posts with process-type CTA found');
      return;
    }

    console.log(`Found ${processPosts.length} posts with process-type CTA:\n`);

    let missingProcessId = 0;
    let correctProcessId = 0;

    processPosts.forEach((post, index) => {
      const hasProcessId = !!post.processId;
      const status = hasProcessId ? '✅' : '❌';
      
      console.log(`${index + 1}. ${status} ${post.title} (${post.domain})`);
      console.log(`   CTA: ${post.ctaAction.target}`);
      console.log(`   Process ID: ${post.processId || 'MISSING!'}`);
      
      if (post.processId && post.ctaAction.target === post.processId) {
        console.log(`   ✓ Process ID matches CTA target`);
        correctProcessId++;
      } else if (post.processId) {
        console.log(`   ⚠️  Process ID doesn't match CTA target!`);
      } else {
        console.log(`   ❌ Process ID is missing!`);
        missingProcessId++;
      }
      console.log('');
    });

    console.log('📊 Summary:');
    console.log(`Total posts with process CTA: ${processPosts.length}`);
    console.log(`Posts with correct processId: ${correctProcessId}`);
    console.log(`Posts with missing processId: ${missingProcessId}`);
    
    if (missingProcessId === 0) {
      console.log('\n✅ All posts with process-type CTAs have processId properly set!');
    } else {
      console.log(`\n❌ ${missingProcessId} posts are missing processId!`);
    }

    // Also check UserPosts
    console.log('\n🔍 Checking if UserPosts inherit processId...');
    const UserPost = mongoose.models.UserPost || require('../app/models/UserPost').default;
    
    const userPostsWithProcess = await UserPost.find({ 
      processId: { $exists: true, $ne: null } 
    }).limit(5);
    
    if (userPostsWithProcess.length > 0) {
      console.log(`\n✅ Found ${userPostsWithProcess.length} UserPosts with processId inherited`);
      userPostsWithProcess.forEach((up: any) => {
        console.log(`   - UserPost ${up._id} has processId: ${up.processId}`);
      });
    } else {
      const totalUserPosts = await UserPost.countDocuments();
      if (totalUserPosts === 0) {
        console.log('\nℹ️  No UserPosts found (no users have been assigned posts yet)');
      } else {
        console.log(`\n⚠️  No UserPosts found with processId (${totalUserPosts} total UserPosts)`);
      }
    }

  } catch (error) {
    console.error('❌ Error verifying posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
verifyPostProcesses();