const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function fixUserDomainRefs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const domainsCollection = db.collection('domains');

    // Get all domains to create a mapping
    const domains = await domainsCollection.find({}).toArray();
    const domainMapping = {};
    
    domains.forEach(domain => {
      // Map common string identifiers to actual ObjectIds
      const possibleIds = [
        domain.name.toLowerCase().replace(/\s+/g, '-'), // "Maven Hub" -> "maven-hub"
        domain.name.toLowerCase().replace(/\s+/g, ''),  // "Maven Hub" -> "mavenhub"
        domain.slug || ''
      ];
      
      possibleIds.forEach(id => {
        if (id) {
          domainMapping[id] = domain._id.toString();
        }
      });
    });

    console.log('\nDomain mapping:', domainMapping);

    // Find all users with incorrect domain references
    const users = await usersCollection.find({
      $or: [
        { 'domains.domainId': { $in: Object.keys(domainMapping) } },
        { 'currentDomainId': { $in: Object.keys(domainMapping) } }
      ]
    }).toArray();

    console.log(`\nFound ${users.length} users with incorrect domain references`);

    for (const user of users) {
      let updated = false;
      const updates = {};

      // Fix currentDomainId
      if (user.currentDomainId && domainMapping[user.currentDomainId]) {
        updates.currentDomainId = domainMapping[user.currentDomainId];
        updated = true;
        console.log(`\nUser ${user.email}:`);
        console.log(`  - currentDomainId: "${user.currentDomainId}" → "${updates.currentDomainId}"`);
      }

      // Fix domains array
      if (user.domains && user.domains.length > 0) {
        const fixedDomains = user.domains.map(membership => {
          if (domainMapping[membership.domainId]) {
            console.log(`  - domains.domainId: "${membership.domainId}" → "${domainMapping[membership.domainId]}"`);
            return {
              ...membership,
              domainId: domainMapping[membership.domainId]
            };
          }
          return membership;
        });

        if (JSON.stringify(fixedDomains) !== JSON.stringify(user.domains)) {
          updates.domains = fixedDomains;
          updated = true;
        }
      }

      // Apply updates
      if (updated) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updates }
        );
        console.log(`  ✓ Updated`);
      }
    }

    // Verify the fix
    console.log('\n=== Verification ===');
    const jacques = await usersCollection.findOne({ email: 'jacques.berg@forus.digital' });
    if (jacques) {
      console.log('Jacques Berg:');
      console.log(`  - currentDomainId: ${jacques.currentDomainId}`);
      console.log(`  - domains:`, jacques.domains);
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserDomainRefs();