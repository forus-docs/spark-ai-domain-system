import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function checkVerificationPosts() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Checking posts that require identity verification...\n');

    // Get all posts that require identity verification
    const verificationPosts = await Post.find({ requiresIdentityVerification: true }).sort({ domain: 1, title: 1 });

    if (verificationPosts.length === 0) {
      console.log('❌ No posts found that require identity verification');
    } else {
      console.log(`Found ${verificationPosts.length} posts that require identity verification:\n`);

      verificationPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Domain: ${post.domain}`);
        console.log(`   Type: ${post.postType}`);
        console.log(`   Process ID: ${post.processId || 'None'}`);
        console.log(`   Description: ${post.description}`);
        console.log(`   CTA: ${post.ctaText}`);
        console.log(`   Active: ${post.isActive}`);
        console.log('');
      });
    }

    // Check for "Claim your MHX" specifically
    console.log('\n🔍 Checking for "Claim your MHX" post...\n');
    
    const mhxPost = await Post.findOne({ 
      title: { $regex: /claim.*mhx/i } 
    });

    if (mhxPost) {
      console.log('Found "Claim your MHX" post:');
      console.log(`   Title: ${mhxPost.title}`);
      console.log(`   Domain: ${mhxPost.domain}`);
      console.log(`   Process ID: ${mhxPost.processId}`);
      console.log(`   Requires Identity Verification: ${mhxPost.requiresIdentityVerification}`);
      console.log(`   Type: ${mhxPost.postType}`);
      console.log(`   CTA: ${mhxPost.ctaText}`);
    } else {
      console.log('❌ "Claim your MHX" post not found');
    }

    // Get all posts
    console.log('\n📋 All posts summary:\n');
    const allPosts = await Post.find({}).select('title domain requiresIdentityVerification processId').sort({ domain: 1, title: 1 });
    
    const byDomain = allPosts.reduce((acc, post) => {
      if (!acc[post.domain]) acc[post.domain] = [];
      acc[post.domain].push(post);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byDomain).forEach(([domain, posts]) => {
      console.log(`\n${domain.toUpperCase()} (${posts.length} posts):`);
      posts.forEach(post => {
        const verifyIcon = post.requiresIdentityVerification ? '🔒' : '✅';
        console.log(`  ${verifyIcon} ${post.title}${post.processId ? ` [process: ${post.processId}]` : ''}`);
      });
    });

  } catch (error) {
    console.error('❌ Error checking posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkVerificationPosts();