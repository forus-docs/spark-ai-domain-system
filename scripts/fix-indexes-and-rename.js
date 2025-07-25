const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function fixIndexesAndRename() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // First, let's handle all index issues
    console.log('\n=== Fixing indexes ===');
    
    // Drop problematic indexes
    const indexesToDrop = [
      { collection: 'masterTasks', index: 'processId_1' },
      { collection: 'userTasks', index: 'userId_1_postId_1' },
      { collection: 'userTasks', index: 'processId_1' },
      { collection: 'taskExecutions', index: 'processId_1' },
      { collection: 'taskExecutions', index: 'userPostId_1_createdAt_-1' }
    ];
    
    for (const { collection, index } of indexesToDrop) {
      try {
        await db.collection(collection).dropIndex(index);
        console.log(`✓ Dropped ${index} from ${collection}`);
      } catch (e) {
        console.log(`Note: ${index} not found in ${collection}`);
      }
    }
    
    // Now proceed with field renames
    console.log('\n=== Starting field renames ===');
    
    // 1. Update domainTasks collection
    console.log('\n--- domainTasks collection ---');
    let result;
    
    result = await db.collection('domainTasks').updateMany(
      { postType: { $exists: true } },
      { $rename: { postType: 'taskType' } }
    );
    console.log(`Renamed postType to taskType: ${result.modifiedCount} documents`);
    
    result = await db.collection('domainTasks').updateMany(
      { prerequisitePosts: { $exists: true } },
      { $rename: { prerequisitePosts: 'prerequisiteTasks' } }
    );
    console.log(`Renamed prerequisitePosts to prerequisiteTasks: ${result.modifiedCount} documents`);
    
    result = await db.collection('domainTasks').updateMany(
      { nextPosts: { $exists: true } },
      { $rename: { nextPosts: 'nextTasks' } }
    );
    console.log(`Renamed nextPosts to nextTasks: ${result.modifiedCount} documents`);
    
    result = await db.collection('domainTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { processId: 'masterTaskId' } }
    );
    console.log(`Renamed processId to masterTaskId: ${result.modifiedCount} documents`);

    // 2. Update userTasks collection
    console.log('\n--- userTasks collection ---');
    
    result = await db.collection('userTasks').updateMany(
      { postId: { $exists: true } },
      { $rename: { postId: 'domainTaskId' } }
    );
    console.log(`Renamed postId to domainTaskId: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { processId: 'masterTaskId' } }
    );
    console.log(`Renamed processId to masterTaskId: ${result.modifiedCount} documents`);
    
    // Handle nested postSnapshot fields
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.postType': { $exists: true } },
      { $rename: { 'postSnapshot.postType': 'postSnapshot.taskType' } }
    );
    console.log(`Renamed postSnapshot.postType: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.prerequisitePosts': { $exists: true } },
      { $rename: { 'postSnapshot.prerequisitePosts': 'postSnapshot.prerequisiteTasks' } }
    );
    console.log(`Renamed postSnapshot.prerequisitePosts: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.nextPosts': { $exists: true } },
      { $rename: { 'postSnapshot.nextPosts': 'postSnapshot.nextTasks' } }
    );
    console.log(`Renamed postSnapshot.nextPosts: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { postSnapshot: { $exists: true } },
      { $rename: { postSnapshot: 'taskSnapshot' } }
    );
    console.log(`Renamed postSnapshot to taskSnapshot: ${result.modifiedCount} documents`);

    // 3. Update taskExecutions collection
    console.log('\n--- taskExecutions collection ---');
    
    result = await db.collection('taskExecutions').updateMany(
      { processId: { $exists: true } },
      { $rename: { processId: 'masterTaskId' } }
    );
    console.log(`Renamed processId to masterTaskId: ${result.modifiedCount} documents`);
    
    result = await db.collection('taskExecutions').updateMany(
      { processName: { $exists: true } },
      { $rename: { processName: 'masterTaskName' } }
    );
    console.log(`Renamed processName to masterTaskName: ${result.modifiedCount} documents`);
    
    result = await db.collection('taskExecutions').updateMany(
      { userPostId: { $exists: true } },
      { $rename: { userPostId: 'userTaskId' } }
    );
    console.log(`Renamed userPostId to userTaskId: ${result.modifiedCount} documents`);

    // 4. Update masterTasks collection
    console.log('\n--- masterTasks collection ---');
    
    result = await db.collection('masterTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { processId: 'masterTaskId' } }
    );
    console.log(`Renamed processId to masterTaskId: ${result.modifiedCount} documents`);

    // 5. Update domains collection
    console.log('\n--- domains collection ---');
    
    result = await db.collection('domains').updateMany(
      { processes: { $exists: true } },
      { $rename: { processes: 'masterTasks' } }
    );
    console.log(`Renamed processes to masterTasks: ${result.modifiedCount} documents`);

    // 6. Create new indexes with correct field names
    console.log('\n=== Creating new indexes ===');
    
    const indexesToCreate = [
      { collection: 'masterTasks', index: { masterTaskId: 1 }, options: { unique: true } },
      { collection: 'userTasks', index: { userId: 1, domainTaskId: 1 }, options: { unique: true } },
      { collection: 'userTasks', index: { masterTaskId: 1 } },
      { collection: 'taskExecutions', index: { masterTaskId: 1 } },
      { collection: 'taskExecutions', index: { userTaskId: 1, createdAt: -1 } }
    ];
    
    for (const { collection, index, options } of indexesToCreate) {
      try {
        await db.collection(collection).createIndex(index, options || {});
        console.log(`✓ Created index on ${collection}:`, Object.keys(index).join(', '));
      } catch (e) {
        console.log(`Note: Index might already exist on ${collection}`);
      }
    }

    // 7. Verify the changes
    console.log('\n=== Verifying changes ===');
    
    const collections = ['domainTasks', 'userTasks', 'taskExecutions', 'masterTasks', 'domains'];
    
    for (const collName of collections) {
      const doc = await db.collection(collName).findOne({});
      if (doc) {
        console.log(`\n${collName} sample:`, Object.keys(doc).slice(0, 10).join(', '), '...');
      }
    }

    // 8. Check for remaining old fields
    console.log('\n=== Checking for old field names ===');
    
    const oldFields = {
      domainTasks: ['postType', 'prerequisitePosts', 'nextPosts', 'processId'],
      userTasks: ['postId', 'processId', 'postSnapshot'],
      taskExecutions: ['processId', 'processName', 'userPostId'],
      masterTasks: ['processId'],
      domains: ['processes']
    };
    
    let hasOldFields = false;
    
    for (const [collection, fields] of Object.entries(oldFields)) {
      for (const field of fields) {
        const count = await db.collection(collection).countDocuments({ [field]: { $exists: true } });
        if (count > 0) {
          console.log(`⚠️  ${collection} still has ${count} documents with field '${field}'`);
          hasOldFields = true;
        }
      }
    }
    
    if (!hasOldFields) {
      console.log('✅ No old field names found!');
    }
    
    console.log('\n✅ Field renaming completed!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the fix
fixIndexesAndRename();