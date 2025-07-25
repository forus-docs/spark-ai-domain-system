const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function verifyFieldAlignment() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    // Expected field mappings
    const expectedFields = {
      masterTasks: {
        required: ['masterTaskId', 'name', 'description'],
        foreignKeys: [],
        oldFields: ['processId']
      },
      domainTasks: {
        required: ['domain', 'title', 'description', 'taskType'],
        foreignKeys: ['masterTaskId'],
        oldFields: ['postType', 'prerequisitePosts', 'nextPosts', 'processId']
      },
      userTasks: {
        required: ['userId', 'domainTaskId', 'taskSnapshot'],
        foreignKeys: ['domainTaskId', 'masterTaskId'],
        oldFields: ['postId', 'processId', 'postSnapshot']
      },
      taskExecutions: {
        required: ['conversationId', 'userId'],
        foreignKeys: ['masterTaskId', 'userTaskId'],
        oldFields: ['processId', 'processName', 'userPostId']
      },
      domains: {
        required: ['domainId', 'name'],
        foreignKeys: ['masterTasks'],
        oldFields: ['processes']
      }
    };
    
    // Check each collection
    for (const [collection, fields] of Object.entries(expectedFields)) {
      console.log(`=== ${collection} Collection ===`);
      
      const totalDocs = await db.collection(collection).countDocuments();
      console.log(`Total documents: ${totalDocs}`);
      
      if (totalDocs > 0) {
        // Get sample documents
        const samples = await db.collection(collection).find({}).limit(3).toArray();
        
        // Check for required fields
        console.log('\n✓ Required fields check:');
        for (const field of fields.required) {
          const count = await db.collection(collection).countDocuments({ [field]: { $exists: true } });
          const percentage = totalDocs > 0 ? ((count / totalDocs) * 100).toFixed(1) : 0;
          console.log(`  - ${field}: ${count}/${totalDocs} (${percentage}%)`);
        }
        
        // Check foreign keys
        if (fields.foreignKeys.length > 0) {
          console.log('\n✓ Foreign key fields:');
          for (const fk of fields.foreignKeys) {
            const count = await db.collection(collection).countDocuments({ [fk]: { $exists: true } });
            const percentage = totalDocs > 0 ? ((count / totalDocs) * 100).toFixed(1) : 0;
            console.log(`  - ${fk}: ${count}/${totalDocs} (${percentage}%)`);
          }
        }
        
        // Check for old fields that should not exist
        console.log('\n✓ Old fields check (should be 0):');
        let hasOldFields = false;
        for (const oldField of fields.oldFields) {
          const count = await db.collection(collection).countDocuments({ [oldField]: { $exists: true } });
          if (count > 0) {
            console.log(`  ⚠️  ${oldField}: ${count} documents still have this field!`);
            hasOldFields = true;
          } else {
            console.log(`  - ${oldField}: 0 (✓)`);
          }
        }
        
        // Show sample document structure
        if (samples.length > 0) {
          console.log('\n✓ Sample document fields:');
          const sampleFields = Object.keys(samples[0]);
          console.log(`  ${sampleFields.join(', ')}`);
        }
        
        // Validate foreign key references
        if (fields.foreignKeys.length > 0) {
          console.log('\n✓ Foreign key validation:');
          
          for (const fk of fields.foreignKeys) {
            // Check if foreign keys point to existing documents
            if (fk === 'masterTaskId' && collection !== 'masterTasks') {
              const invalidRefs = await db.collection(collection).aggregate([
                { $match: { [fk]: { $exists: true, $ne: null } } },
                {
                  $lookup: {
                    from: 'masterTasks',
                    localField: fk,
                    foreignField: 'masterTaskId',
                    as: 'referenced'
                  }
                },
                { $match: { referenced: { $size: 0 } } },
                { $count: 'invalid' }
              ]).toArray();
              
              const invalidCount = invalidRefs[0]?.invalid || 0;
              if (invalidCount > 0) {
                console.log(`  ⚠️  ${fk}: ${invalidCount} documents reference non-existent masterTasks`);
              } else {
                console.log(`  - ${fk}: All references valid (✓)`);
              }
            }
            
            if (fk === 'domainTaskId' && collection === 'userTasks') {
              const invalidRefs = await db.collection(collection).aggregate([
                { $match: { [fk]: { $exists: true, $ne: null } } },
                {
                  $lookup: {
                    from: 'domainTasks',
                    localField: fk,
                    foreignField: '_id',
                    as: 'referenced'
                  }
                },
                { $match: { referenced: { $size: 0 } } },
                { $count: 'invalid' }
              ]).toArray();
              
              const invalidCount = invalidRefs[0]?.invalid || 0;
              if (invalidCount > 0) {
                console.log(`  ⚠️  ${fk}: ${invalidCount} documents reference non-existent domainTasks`);
              } else {
                console.log(`  - ${fk}: All references valid (✓)`);
              }
            }
          }
        }
      }
      
      console.log('\n');
    }
    
    // Check indexes
    console.log('=== Index Verification ===');
    const collections = ['masterTasks', 'domainTasks', 'userTasks', 'taskExecutions'];
    
    for (const coll of collections) {
      const indexes = await db.collection(coll).indexes();
      console.log(`\n${coll} indexes:`);
      for (const idx of indexes) {
        if (idx.name !== '_id_') {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ Field alignment verification complete!');
    console.log('Check the output above for any ⚠️  warnings that need attention.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run verification
verifyFieldAlignment();