import { connectToDatabase } from '../app/lib/database';
import Domain from '../app/models/Domain';
import mongoose from 'mongoose';

async function updateMavenHubRoles() {
  try {
    await connectToDatabase();
    
    console.log('🚀 Updating Maven Hub roles...');

    // Define the new Maven Hub roles
    const newRoles = [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'I want to explore Maven Hub before committing',
        monthlyFee: 10, // Note: This is actually a one-time fee, but schema uses monthlyFee
        benefits: [
          '30-day access to explore',
          'View investment opportunities',
          'Access educational content',
          'Connect with Maven community'
        ]
      },
      {
        id: 'maven',
        name: 'Maven',
        description: 'I want to become a full Maven',
        monthlyFee: 1000, // This is the minimum investment
        benefits: [
          'Full access to invest',
          'List projects for funding',
          'Build the network',
          'Earn revenue share in MHX'
        ]
      },
      {
        id: 'existing_maven',
        name: 'Existing Maven',
        description: 'I\'m already a Maven',
        monthlyFee: 10, // Identity verification fee only
        benefits: [
          'Verify Maven status',
          'Access full features',
          'Continue building network',
          'Maintain existing benefits'
        ]
      },
      {
        id: 'investor_only',
        name: 'Investor Only',
        description: 'I will use the app to monitor activity and watch my investment grow',
        monthlyFee: 10, // Identity verification fee
        benefits: [
          'View investment dashboards',
          'Track MHX performance',
          'Monitor portfolio growth',
          'Upgrade to Maven anytime'
        ]
      }
    ];

    // Update Maven Hub domain
    const result = await Domain.findOneAndUpdate(
      { domainId: 'maven-hub' },
      { 
        $set: { 
          availableRoles: newRoles,
          // Update features to reflect new role structure
          features: [
            'Multiple membership tiers',
            'Investment tracking dashboards',
            'Maven network access',
            'MHX token claiming (30-day window)',
            'Identity verification for all users'
          ]
        }
      },
      { new: true }
    );

    if (result) {
      console.log('✅ Maven Hub roles updated successfully!');
      console.log(`\n📋 Updated roles:`);
      result.availableRoles.forEach(role => {
        console.log(`  - ${role.name} ($${role.monthlyFee})`);
        console.log(`    ${role.description}`);
      });
    } else {
      console.log('⚠️  Maven Hub domain not found. You may need to run migrate-domains.ts first.');
    }

  } catch (error) {
    console.error('❌ Error updating Maven Hub roles:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
updateMavenHubRoles();