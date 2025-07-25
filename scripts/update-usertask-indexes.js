const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function updateUserTaskIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== Updating UserTask indexes ===\n');
    
    // Drop old indexes that use assignedAt
    try {
      await db.collection('userTasks').dropIndex('userId_1_isCompleted_1_isHidden_1_assignedAt_-1');
      console.log('✓ Dropped old index: userId_1_isCompleted_1_isHidden_1_assignedAt_-1');
    } catch (e) {
      console.log('Note: Old assignedAt index not found (OK if new database)');
    }
    
    // Create new indexes with timestampAssigned and assignedTo
    const indexesToCreate = [
      {
        keys: { userId: 1, isCompleted: 1, isHidden: 1, timestampAssigned: -1 },
        name: 'userId_1_isCompleted_1_isHidden_1_timestampAssigned_-1'
      },
      {
        keys: { userId: 1, domainTaskId: 1 },
        options: { unique: true },
        name: 'userId_1_domainTaskId_1'
      },
      {
        keys: { assignedTo: 1, timestampAssigned: -1 },
        name: 'assignedTo_1_timestampAssigned_-1'
      },
      {
        keys: { assignedTo: 1 },
        name: 'assignedTo_1'
      }
    ];
    
    for (const index of indexesToCreate) {
      try {
        const options = index.options || {};
        await db.collection('userTasks').createIndex(index.keys, options);
        console.log(`✓ Created index: ${index.name}`);
      } catch (e) {
        if (e.code === 85) { // Index already exists
          console.log(`Note: Index ${index.name} already exists`);
        } else {
          throw e;
        }
      }
    }
    
    console.log('\n=== Final UserTask indexes ===');
    const indexes = await db.collection('userTasks').indexes();
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
      }
    }
    
    console.log('\n✅ UserTask indexes updated successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the update
updateUserTaskIndexes();