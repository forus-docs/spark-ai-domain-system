import mongoose from 'mongoose';
import User from '../app/models/User';
import Domain from '../app/models/Domain';
import dbConnect from '../app/lib/database';

async function addUserToMavenHub() {
  try {
    await dbConnect();
    
    // Find the user
    const user = await User.findOne({ email: 'jacques.berg@forus.digital' });
    if (!user) {
      console.error('User not found');
      return;
    }
    
    // Find Maven Hub domain
    const mavenHub = await Domain.findOne({ slug: 'maven-hub' });
    if (!mavenHub) {
      console.error('Maven Hub domain not found');
      return;
    }
    
    // Add user to domain
    const userRole = mongoose.Types.ObjectId.createFromHexString('688341f2c8b4c21f6524ee84'); // Default role ID
    
    user.domains = [{
      domain: mavenHub._id,
      role: userRole,
      joinedAt: new Date()
    }];
    
    // Set Maven Hub as current domain
    user.currentDomainId = mavenHub._id;
    
    await user.save();
    
    console.log('✅ User added to Maven Hub successfully');
    console.log('User domains:', user.domains);
    console.log('Current domain:', user.currentDomainId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addUserToMavenHub();