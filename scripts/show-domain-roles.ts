import { connectToDatabase } from '../app/lib/database';
import Domain from '../app/models/Domain';
import mongoose from 'mongoose';

async function showDomainRoles() {
  try {
    await connectToDatabase();
    
    console.log('📋 Domain Roles Summary\n');
    console.log('='.repeat(80));

    const domains = await Domain.find({ active: true }).sort({ domainId: 1 });

    for (const domain of domains) {
      console.log(`\n🌐 ${domain.name} (${domain.domainId})`);
      console.log(`   Region: ${domain.region || 'Global'}`);
      console.log(`   Members: ${domain.memberCount.toLocaleString()}`);
      console.log(`   ${domain.tagline || ''}\n`);
      
      console.log('   Available Roles:');
      console.log('   ' + '-'.repeat(70));
      
      domain.availableRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.name} - $${role.monthlyFee}`);
        console.log(`      "${role.description}"`);
        console.log(`      Benefits:`);
        role.benefits.forEach(benefit => {
          console.log(`      • ${benefit}`);
        });
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('\n💡 Key Points:');
    console.log('   • All domains have a "Visitor" role ($10) for 30-day exploration');
    console.log('   • All domains have an "Existing Member" role ($10) for verification');
    console.log('   • Identity verification fee ($10) is required for all users');
    console.log('   • Higher tier roles include identity verification in their price');
    console.log('   • Users can upgrade their role at any time');

  } catch (error) {
    console.error('❌ Error showing domain roles:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
showDomainRoles();