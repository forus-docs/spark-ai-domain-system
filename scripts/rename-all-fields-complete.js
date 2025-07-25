const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function renameAllFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Update domainTasks collection (formerly posts)
    console.log('\n=== Updating domainTasks collection ===');
    
    // Check if fields exist before renaming
    const sampleDomainTask = await db.collection('domainTasks').findOne({});
    console.log('Sample domainTask fields:', Object.keys(sampleDomainTask || {}));
    
    // Rename fields
    let result = await db.collection('domainTasks').updateMany(
      { postType: { $exists: true } },
      { $rename: { 
        postType: 'taskType'
      } }
    );
    console.log(`✓ Renamed postType to taskType: ${result.modifiedCount} documents`);
    
    result = await db.collection('domainTasks').updateMany(
      { prerequisitePosts: { $exists: true } },
      { $rename: { 
        prerequisitePosts: 'prerequisiteTasks'
      } }
    );
    console.log(`✓ Renamed prerequisitePosts to prerequisiteTasks: ${result.modifiedCount} documents`);
    
    result = await db.collection('domainTasks').updateMany(
      { nextPosts: { $exists: true } },
      { $rename: { 
        nextPosts: 'nextTasks'
      } }
    );
    console.log(`✓ Renamed nextPosts to nextTasks: ${result.modifiedCount} documents`);
    
    // Rename processId to masterTaskId if it exists
    result = await db.collection('domainTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { 
        processId: 'masterTaskId'
      } }
    );
    console.log(`✓ Renamed processId to masterTaskId: ${result.modifiedCount} documents`);

    // 2. Handle userTasks collection with index issues
    console.log('\n=== Updating userTasks collection ===');
    
    // List current indexes
    const userTaskIndexes = await db.collection('userTasks').indexes();
    console.log('Current userTasks indexes:', userTaskIndexes.map(idx => idx.name).join(', '));
    
    // Drop old index if it exists
    try {
      await db.collection('userTasks').dropIndex('userId_1_postId_1');
      console.log('✓ Dropped old userId_1_postId_1 index');
    } catch (e) {
      console.log('Note: userId_1_postId_1 index not found or already dropped');
    }
    
    // Rename fields
    result = await db.collection('userTasks').updateMany(
      { postId: { $exists: true } },
      { $rename: { 
        postId: 'domainTaskId'
      } }
    );
    console.log(`✓ Renamed postId to domainTaskId: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { 
        processId: 'masterTaskId'
      } }
    );
    console.log(`✓ Renamed processId to masterTaskId: ${result.modifiedCount} documents`);
    
    // Create new index with correct field name
    try {
      await db.collection('userTasks').createIndex(
        { userId: 1, domainTaskId: 1 }, 
        { unique: true }
      );
      console.log('✓ Created new userId_1_domainTaskId_1 index');
    } catch (e) {
      console.log('Note: Index might already exist');
    }
    
    // Update nested fields in postSnapshot
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.postType': { $exists: true } },
      { $rename: { 
        'postSnapshot.postType': 'postSnapshot.taskType'
      } }
    );
    console.log(`✓ Renamed postSnapshot.postType to postSnapshot.taskType: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.prerequisitePosts': { $exists: true } },
      { $rename: { 
        'postSnapshot.prerequisitePosts': 'postSnapshot.prerequisiteTasks'
      } }
    );
    console.log(`✓ Renamed postSnapshot.prerequisitePosts: ${result.modifiedCount} documents`);
    
    result = await db.collection('userTasks').updateMany(
      { 'postSnapshot.nextPosts': { $exists: true } },
      { $rename: { 
        'postSnapshot.nextPosts': 'postSnapshot.nextTasks'
      } }
    );
    console.log(`✓ Renamed postSnapshot.nextPosts: ${result.modifiedCount} documents`);
    
    // Rename postSnapshot to taskSnapshot
    result = await db.collection('userTasks').updateMany(
      { postSnapshot: { $exists: true } },
      { $rename: { postSnapshot: 'taskSnapshot' } }
    );
    console.log(`✓ Renamed postSnapshot to taskSnapshot: ${result.modifiedCount} documents`);

    // 3. Update taskExecutions collection (formerly conversations)
    console.log('\n=== Updating taskExecutions collection ===');
    
    result = await db.collection('taskExecutions').updateMany(
      { processId: { $exists: true } },
      { $rename: { 
        processId: 'masterTaskId'
      } }
    );
    console.log(`✓ Renamed processId to masterTaskId: ${result.modifiedCount} documents`);
    
    result = await db.collection('taskExecutions').updateMany(
      { processName: { $exists: true } },
      { $rename: { 
        processName: 'masterTaskName'
      } }
    );
    console.log(`✓ Renamed processName to masterTaskName: ${result.modifiedCount} documents`);
    
    result = await db.collection('taskExecutions').updateMany(
      { userPostId: { $exists: true } },
      { $rename: { 
        userPostId: 'userTaskId'
      } }
    );
    console.log(`✓ Renamed userPostId to userTaskId: ${result.modifiedCount} documents`);

    // 4. Update masterTasks collection (formerly processes)
    console.log('\n=== Updating masterTasks collection ===');
    
    // Check if processId needs to be renamed to masterTaskId
    result = await db.collection('masterTasks').updateMany(
      { processId: { $exists: true } },
      { $rename: { 
        processId: 'masterTaskId'
      } }
    );
    console.log(`✓ Renamed processId to masterTaskId: ${result.modifiedCount} documents`);

    // 5. Update domains collection
    console.log('\n=== Updating domains collection ===');
    
    // Check if processes array exists and rename to masterTasks
    result = await db.collection('domains').updateMany(
      { processes: { $exists: true } },
      { $rename: { 
        processes: 'masterTasks'
      } }
    );
    console.log(`✓ Renamed processes to masterTasks: ${result.modifiedCount} documents`);
    
    // Also check adoptedByDomains.processId in masterTasks
    result = await db.collection('masterTasks').updateMany(
      { 'adoptedByDomains.processId': { $exists: true } },
      { $rename: { 
        'adoptedByDomains.$[].processId': 'adoptedByDomains.$[].masterTaskId'
      } }
    );
    console.log(`✓ Renamed adoptedByDomains.processId: ${result.modifiedCount} documents`);

    // 6. List all indexes to verify
    console.log('\n=== Current indexes ===');
    const collections = ['domainTasks', 'userTasks', 'taskExecutions', 'masterTasks', 'domains'];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName} indexes:`, indexes.map(idx => idx.name).join(', '));
    }

    // 7. Verify the changes by sampling documents
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
    
    // Check masterTasks
    const masterTask = await db.collection('masterTasks').findOne({});
    console.log('\nSample masterTask fields:', Object.keys(masterTask || {}));
    
    // Check domains
    const domain = await db.collection('domains').findOne({});
    console.log('\nSample domain fields:', Object.keys(domain || {}));
    
    // 8. Check for any remaining old field names
    console.log('\n=== Checking for old field names ===');
    
    const oldFieldChecks = [
      { collection: 'domainTasks', fields: ['postType', 'prerequisitePosts', 'nextPosts', 'processId'] },
      { collection: 'userTasks', fields: ['postId', 'processId', 'postSnapshot'] },
      { collection: 'taskExecutions', fields: ['processId', 'processName', 'userPostId'] },
      { collection: 'masterTasks', fields: ['processId'] },
      { collection: 'domains', fields: ['processes'] }
    ];
    
    for (const check of oldFieldChecks) {
      for (const field of check.fields) {
        const count = await db.collection(check.collection).countDocuments({ [field]: { $exists: true } });
        if (count > 0) {
          console.log(`⚠️  WARNING: ${check.collection} still has ${count} documents with field '${field}'`);
        }
      }
    }
    
    console.log('\n✅ All field renames completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the rename operation
renameAllFields();