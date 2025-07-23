import { connectToDatabase } from '../app/lib/database';
import Post from '../app/models/Post';
import mongoose from 'mongoose';

async function seedPosts() {
  try {
    await connectToDatabase();
    
    console.log('🌱 Seeding posts...');

    // Clear existing posts
    await Post.deleteMany({});
    
    // Identity Verification Post (Universal - assigned to all new users)
    await Post.create({
      domain: 'all',
      title: 'Verify Your Identity',
      description: 'Complete identity verification to unlock all features and participate fully in the ecosystem',
      postType: 'identity_verification',
      iconType: 'shield',
      colorScheme: 'blue',
      category: 'required',
      priority: 'urgent',
      estimatedTime: '5 min',
      canHide: false,
      ctaText: 'Start Verification',
      ctaAction: {
        type: 'process',
        target: 'identity-verification'
      },
      requiresIdentityVerification: false, // This post itself doesn't require verification
      prerequisitePosts: [],
      nextPosts: [],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Unlock all features'
      },
      isActive: true,
      processId: 'identity-verification' // Link to identity verification process
    });

    // Maven Hub Posts
    // Claim your MHX - NEW POST
    await Post.create({
      domain: 'maven-hub',
      title: 'Claim your MHX',
      description: 'In light of an imminent liquidity event, FORUS Digital has to verify your MHX holdings and Maven Status. You will be directed to an AI chatstream to help with the verification. A human will be standing by to assist if there are any issues.',
      postType: 'onboarding',
      iconType: 'trophy',
      colorScheme: 'orange',
      category: 'required',
      priority: 'urgent',
      estimatedTime: '5 min',
      canHide: false,
      ctaText: 'Claim MHX',
      ctaAction: {
        type: 'process',
        target: 'mhx-verification'
      },
      requiresIdentityVerification: false,
      prerequisitePosts: [],
      nextPosts: [],
      reward: {
        amount: 0,
        currency: 'MHX',
        displayText: 'Verify MHX Holdings'
      },
      isActive: true,
      processId: 'mhx-verification' // Link to MHX verification process
    });

    // Identity Verification for Maven Hub
    await Post.create({
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
      requiresIdentityVerification: false,
      prerequisitePosts: [],
      nextPosts: ['maven-investor-profile'],
      reward: {
        amount: 50,
        currency: 'Maven Points',
        displayText: '+50 Maven Points'
      },
      isActive: true,
      processId: 'identity-verification'
    });

    await Post.create({
      domain: 'maven-hub',
      title: 'Complete Your Investor Profile',
      description: 'Tell us about your investment interests and goals to receive personalized opportunities',
      postType: 'onboarding',
      iconType: 'briefcase',
      colorScheme: 'purple',
      category: 'required',
      priority: 'high',
      estimatedTime: '10 min',
      canHide: false,
      ctaText: 'Complete Profile',
      ctaAction: {
        type: 'process',
        target: 'investor-profile'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: [],
      nextPosts: ['maven-training-1', 'maven-opportunity-1'],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Unlock deal flow'
      },
      isActive: true,
      processId: 'investor-profile' // Link to investor profile process
    });

    await Post.create({
      domain: 'maven-hub',
      title: 'Investment Fundamentals',
      description: 'Learn the basics of startup investing and due diligence',
      postType: 'training',
      iconType: 'book',
      colorScheme: 'green',
      category: 'recommended',
      priority: 'normal',
      estimatedTime: '30 min',
      canHide: true,
      ctaText: 'Start Learning',
      ctaAction: {
        type: 'navigate',
        target: '/training/investment-fundamentals'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: [],
      nextPosts: ['maven-training-2'],
      reward: {
        amount: 100,
        currency: 'Maven Points',
        displayText: '+100 Maven Points'
      },
      isActive: true
    });

    await Post.create({
      domain: 'maven-hub',
      title: 'Review: TechStart AI Platform',
      description: 'Exclusive opportunity to invest in an AI-powered startup platform',
      postType: 'opportunity',
      iconType: 'lightbulb',
      colorScheme: 'orange',
      category: 'optional',
      priority: 'low',
      estimatedTime: '15 min',
      canHide: true,
      ctaText: 'View Opportunity',
      ctaAction: {
        type: 'process',
        target: 'investment-review'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: ['investor-profile'],
      nextPosts: [],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Early access'
      },
      isActive: true,
      processId: 'investment-review' // Link to investment review process
    });

    // Wealth on Wheels Posts
    await Post.create({
      domain: 'wealth-on-wheels',
      title: 'Vehicle Registration',
      description: 'Register your vehicle to start earning with the Wealth on Wheels network',
      postType: 'onboarding',
      iconType: 'checklist',
      colorScheme: 'blue',
      category: 'required',
      priority: 'urgent',
      estimatedTime: '15 min',
      canHide: false,
      ctaText: 'Register Vehicle',
      ctaAction: {
        type: 'process',
        target: 'vehicle-registration'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: [],
      nextPosts: ['wow-compliance-1'],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Start earning'
      },
      isActive: true,
      processId: 'vehicle-registration' // Link to vehicle registration process
    });

    await Post.create({
      domain: 'wealth-on-wheels',
      title: 'Safety Compliance Check',
      description: 'Complete monthly safety compliance verification for your vehicle',
      postType: 'task',
      iconType: 'shield',
      colorScheme: 'orange',
      category: 'required',
      priority: 'high',
      estimatedTime: '20 min',
      canHide: false,
      ctaText: 'Start Check',
      ctaAction: {
        type: 'process',
        target: 'safety-compliance'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: ['vehicle-registration'],
      nextPosts: [],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Stay compliant'
      },
      isActive: true,
      processId: 'safety-compliance' // Link to safety compliance process
    });

    // PACCI Posts
    await Post.create({
      domain: 'pacci',
      title: 'Chamber Membership Application',
      description: 'Join the Pan African Chamber of Commerce to access business resources and networking',
      postType: 'onboarding',
      iconType: 'users',
      colorScheme: 'green',
      category: 'required',
      priority: 'high',
      estimatedTime: '10 min',
      canHide: false,
      ctaText: 'Apply Now',
      ctaAction: {
        type: 'process',
        target: 'membership-application'
      },
      requiresIdentityVerification: true,
      prerequisitePosts: [],
      nextPosts: ['pacci-training-1', 'pacci-announcement-1'],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Chamber access'
      },
      isActive: true,
      processId: 'membership-application' // Link to membership application process
    });

    // Bemnet Posts
    await Post.create({
      domain: 'bemnet',
      title: 'Set Your Savings Goal',
      description: 'Define your financial goals and start your journey to financial freedom',
      postType: 'onboarding',
      iconType: 'trophy',
      colorScheme: 'purple',
      category: 'required',
      priority: 'high',
      estimatedTime: '5 min',
      canHide: false,
      ctaText: 'Set Goal',
      ctaAction: {
        type: 'process',
        target: 'savings-goal'
      },
      requiresIdentityVerification: false, // Bemnet allows goal setting before verification
      prerequisitePosts: [],
      nextPosts: ['bemnet-training-1'],
      reward: {
        amount: 0,
        currency: 'XP',
        displayText: 'Track progress'
      },
      isActive: true,
      processId: 'savings-goal' // Link to savings goal process
    });

    console.log('✅ Posts seeded successfully!');
    
    // Display summary
    const postCount = await Post.countDocuments();
    const domainCounts = await Post.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } }
    ]);
    
    console.log(`\n📊 Summary:`);
    console.log(`Total posts created: ${postCount}`);
    console.log('\nPosts by domain:');
    domainCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} posts`);
    });

  } catch (error) {
    console.error('❌ Error seeding posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed script
seedPosts();