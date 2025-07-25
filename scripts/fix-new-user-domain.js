const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function fixNewUserDomain() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('spark-ai');
    const usersCollection = db.collection('users');
    const domainsCollection = db.collection('domains');

    // Get Maven Hub domain
    const mavenHub = await domainsCollection.findOne({ name: 'Maven Hub' });
    if (!mavenHub) {
      console.error('Maven Hub domain not found!');
      return;
    }

    const correctMavenHubId = mavenHub._id.toString();
    console.log('Correct Maven Hub ID:', correctMavenHubId);

    // Find and update Jacques
    const user = await usersCollection.findOne({ email: 'jacques.berg@forus.digital' });
    if (!user) {
      console.error('User not found!');
      return;
    }

    console.log('\nCurrent user state:');
    console.log('- currentDomainId:', user.currentDomainId);
    console.log('- domains[0].domainId:', user.domains[0]?.domainId);

    // Update the user
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          currentDomainId: correctMavenHubId,
          'domains.0.domainId': correctMavenHubId
        }
      }
    );

    console.log('\nUpdate result:', updateResult.modifiedCount, 'document(s) modified');

    // Verify the update
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    console.log('\nUpdated user state:');
    console.log('- currentDomainId:', updatedUser.currentDomainId);
    console.log('- domains[0].domainId:', updatedUser.domains[0]?.domainId);

    await client.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

fixNewUserDomain();