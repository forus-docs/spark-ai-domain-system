const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function renameCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Existing collections:', collectionNames);
    
    // Define rename mappings
    const renameMappings = [
      { from: 'processes', to: 'masterTasks' },
      { from: 'posts', to: 'domainTasks' },
      { from: 'userposts', to: 'userTasks' },
      { from: 'conversations', to: 'taskExecutions' },
      { from: 'messages', to: 'executionMessages' }
    ];
    
    // Perform renames
    for (const mapping of renameMappings) {
      if (collectionNames.includes(mapping.from)) {
        console.log(`Renaming ${mapping.from} -> ${mapping.to}`);
        await db.collection(mapping.from).rename(mapping.to);
        console.log(`✓ Renamed ${mapping.from} to ${mapping.to}`);
      } else {
        console.log(`⚠️  Collection ${mapping.from} not found, skipping`);
      }
    }
    
    // Show final collections
    const finalCollections = await db.listCollections().toArray();
    console.log('\nFinal collections:', finalCollections.map(c => c.name));
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

renameCollections();