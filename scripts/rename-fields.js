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

    // 2. Update userTasks collection (formerly userposts)
    console.log('\n=== Updating userTasks collection ===');
    await db.collection('userTasks').updateMany(
      { postId: { $exists: true } },
      { $rename: { 
        postId: 'domainTaskId',
        processId: 'masterTaskId'
      } }
    );
    
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

    // 5. Verify the changes
    console.log('\n=== Verifying changes ===');
    
    // Check domainTasks
    const domainTask = await db.collection('domainTasks').findOne({});
    console.log('Sample domainTask fields:', Object.keys(domainTask || {}));
    
    // Check userTasks
    const userTask = await db.collection('userTasks').findOne({});
    console.log('Sample userTask fields:', Object.keys(userTask || {}));
    if (userTask?.taskSnapshot) {
      console.log('Sample taskSnapshot fields:', Object.keys(userTask.taskSnapshot));
    }
    
    // Check taskExecutions
    const taskExecution = await db.collection('taskExecutions').findOne({});
    console.log('Sample taskExecution fields:', Object.keys(taskExecution || {}));
    
    console.log('\n✅ All field renames completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

renameFields();