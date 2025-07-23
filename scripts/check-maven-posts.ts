import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function checkMavenPosts() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Checking all Maven Hub posts...\n');

    // Get all Maven Hub posts
    const mavenPosts = await Post.find({ domain: 'maven-hub' }).sort({ createdAt: 1 });

    if (mavenPosts.length === 0) {
      console.log('❌ No posts found for Maven Hub domain');
      return;
    }

    console.log(`Found ${mavenPosts.length} posts for Maven Hub:\n`);

    mavenPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   Type: ${post.postType}`);
      console.log(`   Description: ${post.description}`);
      console.log(`   CTA: ${post.ctaText} → ${post.ctaAction.type}:${post.ctaAction.target}`);
      console.log(`   Process ID: ${post.processId || 'None'}`);
      console.log(`   Priority: ${post.priority}`);
      console.log(`   Active: ${post.isActive}`);
      console.log('');
    });

    // Check specifically for identity verification post
    const identityPost = await Post.findOne({
      domain: 'maven-hub',
      postType: 'identity_verification'
    });

    if (!identityPost) {
      console.log('⚠️  No identity verification post found for Maven Hub!');
      console.log('   Run: npm run add:maven-identity to add it');
    } else {
      console.log('✅ Identity verification post exists for Maven Hub');
    }

  } catch (error) {
    console.error('❌ Error checking posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkMavenPosts();