const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function renameFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Update domainTasks collection (formerly posts)
    console.log('\n=== Updating domainTasks collection ===');
    await db.collection('domainTasks').updateMany(
      { postType: { $exists: true } },
      { $rename: { 
        postType: 'taskType',
        prerequisitePosts: 'prerequisiteTasks',
        nextPosts: 'nextTasks'
      } }
    );
    console.log('✓ Renamed fields in domainTasks');

    // 2. Handle userTasks collection with index issues
    console.log('\n=== Updating userTasks collection ===');
    
    // First, drop the problematic index
    try {
      await db.collection('userTasks').dropIndex('userId_1_postId_1');
      console.log('✓ Dropped old userId_1_postId_1 index');
    } catch (e) {
      console.log('Note: userId_1_postId_1 index not found or already dropped');
    }
    
    // Rename fields
    await db.collection('userTasks').updateMany(
      { postId: { $exists: true } },
      { $rename: { 
        postId: 'domainTaskId',
        processId: 'masterTaskId'
      } }
    );
    
    // Create new index with correct field name
    await db.collection('userTasks').createIndex(
      { userId: 1, domainTaskId: 1 }, 
      { unique: true }
    );
    console.log('✓ Created new userId_1_domainTaskId_1 index');
    
    // Update nested fields in postSnapshot
    await db.collection('userTasks').updateMany(
      { 'postSnapshot.postType': { $exists: true } },
      { $rename: { 
        'postSnapshot.postType': 'postSnapshot.taskType',
        'postSnapshot.prerequisitePosts': 'postSnapshot.prerequisiteTasks',
        'postSnapshot.nextPosts': 'postSnapshot.nextTasks'
      } }
    );
    
    // Rename postSnapshot to taskSnapshot
    await db.collection('userTasks').updateMany(
      { postSnapshot: { $exists: true } },
      { $rename: { postSnapshot: 'taskSnapshot' } }
    );
    
    console.log('✓ Renamed fields in userTasks');

    // 3. Update taskExecutions collection (formerly conversations)
    console.log('\n=== Updating taskExecutions collection ===');
    await db.collection('taskExecutions').updateMany(
      { processId: { $exists: true } },
      { $rename: { 
        processId: 'masterTaskId',
        processName: 'masterTaskName',
        userPostId: 'userTaskId'
      } }
    );
    console.log('✓ Renamed fields in taskExecutions');

    // 4. Update masterTasks collection (formerly processes)
    console.log('\n=== Updating masterTasks collection ===');
    // No field renames needed for masterTasks
    console.log('✓ No field renames needed for masterTasks');

    // 5. List all indexes to verify
    console.log('\n=== Current indexes ===');
    const collections = ['domainTasks', 'userTasks', 'taskExecutions', 'masterTasks'];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName} indexes:`, indexes.map(idx => idx.name).join(', '));
    }

    // 6. Verify the changes
    console.log('\n=== Verifying changes ===');
    
    // Check domainTasks
    const domainTask = await db.collection('domainTasks').findOne({});
    console.log('\nSample domainTask fields:', Object.keys(domainTask || {}));
    
    // Check userTasks
    const userTask = await db.collection('userTasks').findOne({});
    console.log('\nSample userTask fields:', Object.keys(userTask || {}));
    if (userTask?.taskSnapshot) {
      console.log('Sample taskSnapshot fields:', Object.keys(userTask.taskSnapshot));
    }
    
    // Check taskExecutions
    const taskExecution = await db.collection('taskExecutions').findOne({});
    console.log('\nSample taskExecution fields:', Object.keys(taskExecution || {}));
    
    console.log('\n✅ All field renames completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

renameFields();