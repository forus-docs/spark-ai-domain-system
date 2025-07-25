const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function finalCleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    // 1. Drop old indexes
    console.log('=== Cleaning up old indexes ===');
    
    const oldIndexes = [
      { collection: 'domainTasks', index: 'processId_1' },
      { collection: 'taskExecutions', index: 'userId_1_processId_1' },
      { collection: 'taskExecutions', index: 'userPostId_1' }
    ];
    
    for (const { collection, index } of oldIndexes) {
      try {
        await db.collection(collection).dropIndex(index);
        console.log(`✓ Dropped old index ${index} from ${collection}`);
      } catch (e) {
        console.log(`Note: ${index} not found in ${collection}`);
      }
    }
    
    // 2. Create missing indexes with new field names
    console.log('\n=== Creating missing indexes ===');
    
    try {
      await db.collection('taskExecutions').createIndex({ userId: 1, masterTaskId: 1 });
      console.log('✓ Created userId_1_masterTaskId_1 index on taskExecutions');
    } catch (e) {
      console.log('Note: Index might already exist');
    }
    
    // 3. Check and report on foreign key issues
    console.log('\n=== Foreign Key Analysis ===');
    
    // Check userTasks -> domainTasks references
    const userTasksWithInvalidRefs = await db.collection('userTasks').aggregate([
      { $match: { domainTaskId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'domainTasks',
          let: { taskId: '$domainTaskId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$taskId' }] } } }
          ],
          as: 'referenced'
        }
      },
      { $match: { referenced: { $size: 0 } } },
      { $project: { _id: 1, userId: 1, domainTaskId: 1 } }
    ]).toArray();
    
    if (userTasksWithInvalidRefs.length > 0) {
      console.log(`\n⚠️  Found ${userTasksWithInvalidRefs.length} userTasks with invalid domainTaskId references:`);
      userTasksWithInvalidRefs.forEach(doc => {
        console.log(`  - UserTask ${doc._id}: references domainTask ${doc.domainTaskId} which doesn't exist`);
      });
    }
    
    // Check domainTasks -> masterTasks references
    const domainTasksWithInvalidRefs = await db.collection('domainTasks').aggregate([
      { $match: { masterTaskId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'masterTasks',
          localField: 'masterTaskId',
          foreignField: 'masterTaskId',
          as: 'referenced'
        }
      },
      { $match: { referenced: { $size: 0 } } },
      { $project: { _id: 1, title: 1, masterTaskId: 1 } }
    ]).toArray();
    
    if (domainTasksWithInvalidRefs.length > 0) {
      console.log(`\n⚠️  Found ${domainTasksWithInvalidRefs.length} domainTasks with invalid masterTaskId references:`);
      domainTasksWithInvalidRefs.forEach(doc => {
        console.log(`  - DomainTask "${doc.title}": references masterTask ${doc.masterTaskId} which doesn't exist`);
      });
    }
    
    // 4. Final index listing
    console.log('\n=== Final Index Status ===');
    
    const collections = ['masterTasks', 'domainTasks', 'userTasks', 'taskExecutions'];
    
    for (const coll of collections) {
      const indexes = await db.collection(coll).indexes();
      console.log(`\n${coll}:`);
      for (const idx of indexes) {
        if (idx.name !== '_id_') {
          const keys = Object.keys(idx.key);
          const hasOldFields = keys.some(k => 
            ['processId', 'postId', 'userPostId', 'processName', 'postSnapshot'].includes(k)
          );
          
          if (hasOldFields) {
            console.log(`  ⚠️  ${idx.name}: ${JSON.stringify(idx.key)} [OLD FIELD NAMES]`);
          } else {
            console.log(`  ✓ ${idx.name}: ${JSON.stringify(idx.key)}`);
          }
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ Final cleanup complete!');
    console.log('\nNOTE: Foreign key reference issues found above may require:');
    console.log('  1. Updating the IDs to match the correct format');
    console.log('  2. Removing orphaned records');
    console.log('  3. Re-creating the missing referenced documents');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run cleanup
finalCleanup();