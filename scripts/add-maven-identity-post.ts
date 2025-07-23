import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function addMavenIdentityPost() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Checking for Maven Hub identity document capture post...');

    // Check if the post already exists
    const existingPost = await Post.findOne({
      domain: 'maven-hub',
      postType: 'identity_verification',
      title: 'Capture ID Document'
    });

    if (existingPost) {
      console.log('✅ Post already exists!');
      return;
    }

    // Create the Maven Hub identity document capture post
    const newPost = await Post.create({
      domain: 'maven-hub',
      title: 'Capture ID Document',
      description: 'Upload your ID document to verify your identity and unlock investment opportunities',
      postType: 'identity_verification',
      iconType: 'shield',
      colorScheme: 'blue',
      category: 'required',
      priority: 'urgent',
      estimatedTime: '2 min',
      canHide: false,
      ctaText: 'Upload Document',
      ctaAction: {
        type: 'process',
        target: 'identity-verification'
      },
      requiresIdentityVerification: false, // This IS the identity verification
      prerequisitePosts: [],
      nextPosts: ['maven-investor-profile'], // After ID verification, complete investor profile
      reward: {
        amount: 50,
        currency: 'Maven Points',
        displayText: '+50 Maven Points'
      },
      isActive: true,
      processId: 'identity-verification' // Link to the identity verification process
    });

    console.log('✅ Successfully created Maven Hub identity document capture post!');
    console.log('Post ID:', newPost._id);
    console.log('Title:', newPost.title);
    console.log('Domain:', newPost.domain);

  } catch (error) {
    console.error('❌ Error adding post:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addMavenIdentityPost();