import { connectToDatabase } from '../app/lib/database';
import User from '../app/models/User';
import { PostJourneyService } from '../app/lib/services/post-journey.service';
import mongoose from 'mongoose';

async function assignDomainPosts() {
  try {
    await connectToDatabase();
    
    console.log('🌟 Assigning domain posts...\n');

    // Get the user
    const user = await User.findOne({ email: 'jacques.berg@forus.digital' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`Domains: ${user.domains.map((d: any) => d.domainId).join(', ') || 'None'}\n`);

    // Check if user has joined maven-hub
    const hasMavenHub = user.domains.some((d: any) => d.domainId === 'maven-hub');
    
    if (hasMavenHub) {
      console.log('✓ User has joined maven-hub');
      console.log('📦 Assigning Maven Hub onboarding posts...');
      
      await PostJourneyService.assignDomainOnboardingPosts(
        user._id.toString(),
        'maven-hub'
      );
      
      console.log('✅ Maven Hub posts assigned!');
    } else {
      console.log('ℹ️  User has not joined maven-hub yet');
    }

    // Show all user posts after assignment
    const userPosts = await PostJourneyService.getUserPosts(user._id.toString(), {
      includeCompleted: true,
      includeHidden: true
    });

    console.log(`\n📋 User now has ${userPosts.length} posts:`);
    userPosts.forEach(post => {
      console.log(`  - ${post.masterPost.title} (${post.masterPost.domain})`);
    });

  } catch (error) {
    console.error('❌ Error assigning domain posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
assignDomainPosts();