const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netbuild';

const bpmDomainId = '688ac3af4a50c31cd29bb227';
const bpmDomain = {
  domain: 'business-process-management',
  domainId: 'business-process-management',
  role: 'visitor',
  permissions: ['read'],
  joinedAt: new Date()
};

const demoUsers = [
  {
    username: 'demo',
    email: 'demo@netbuild.local',
    name: 'Demo User',
    provider: 'keycloak',
    providerId: '53a85c88-f304-4b50-8484-ce8440114863',
    keycloakId: '53a85c88-f304-4b50-8484-ce8440114863',
    identity: {
      provider: 'keycloak',
      providerId: '53a85c88-f304-4b50-8484-ce8440114863',
      isVerified: true
    },
    domains: [bpmDomain],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'john',
    email: 'john@netbuild.local',
    name: 'John User',
    provider: 'keycloak',
    providerId: '9f4c980d-b8a9-4387-a711-254bc12dd65b',
    keycloakId: '9f4c980d-b8a9-4387-a711-254bc12dd65b',
    identity: {
      provider: 'keycloak',
      providerId: '9f4c980d-b8a9-4387-a711-254bc12dd65b',
      isVerified: true
    },
    domains: [bpmDomain],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'mary',
    email: 'mary@netbuild.local', 
    name: 'Mary User',
    provider: 'keycloak',
    providerId: '20ad37a2-197b-4b02-bc5a-ed19bcd2238f',
    keycloakId: '20ad37a2-197b-4b02-bc5a-ed19bcd2238f',
    identity: {
      provider: 'keycloak',
      providerId: '20ad37a2-197b-4b02-bc5a-ed19bcd2238f',
      isVerified: true
    },
    domains: [bpmDomain],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'peter',
    email: 'peter@netbuild.local',
    name: 'Peter User',
    provider: 'keycloak',
    providerId: '220af663-1591-4eac-9a17-3fdd34914c35',
    keycloakId: '220af663-1591-4eac-9a17-3fdd34914c35',
    identity: {
      provider: 'keycloak',
      providerId: '220af663-1591-4eac-9a17-3fdd34914c35',
      isVerified: true
    },
    domains: [bpmDomain],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createDemoUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const domainsCollection = db.collection('domains');
    
    // Create or update each user
    for (const user of demoUsers) {
      const result = await usersCollection.updateOne(
        { username: user.username },
        { $set: user },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`User ${user.username}: created`);
      } else {
        console.log(`User ${user.username}: updated`);
      }
    }
    
    // Update domain member count
    const memberCount = await usersCollection.countDocuments({ 
      'domains.domainId': 'business-process-management' 
    });
    
    await domainsCollection.updateOne(
      { _id: new ObjectId(bpmDomainId) },
      { $set: { memberCount: memberCount } }
    );
    
    console.log(`\nTotal BPM domain members: ${memberCount}`);
    console.log('\n✅ Demo users created successfully!');
    console.log('\nYou can now login with:');
    console.log('  - demo/demo (Admin)');
    console.log('  - john/john (Sales)');
    console.log('  - mary/mary (Accounting)');
    console.log('  - peter/peter (Management)');
    
  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    await client.close();
  }
}

createDemoUsers();