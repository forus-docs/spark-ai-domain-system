const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function fixMasterTaskProcessId() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== Fixing Master Task processId ===\n');
    
    // Find the "Capture ID Document" master task
    const captureIdTask = await db.collection('masterTasks').findOne({
      name: 'Capture ID Document'
    });
    
    if (captureIdTask) {
      console.log('Found "Capture ID Document" master task');
      console.log(`Current processId: ${captureIdTask.processId}`);
      
      // Update it to have processId: 'identity-verification'
      const result = await db.collection('masterTasks').updateOne(
        { _id: captureIdTask._id },
        { $set: { processId: 'identity-verification' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Updated processId to "identity-verification"');
      } else {
        console.log('❌ Failed to update processId');
      }
    } else {
      console.log('❌ "Capture ID Document" master task not found');
    }
    
    // Also update MHX Holdings Verification if needed
    const mhxTask = await db.collection('masterTasks').findOne({
      name: 'MHX Holdings Verification'
    });
    
    if (mhxTask && (!mhxTask.processId || mhxTask.processId === 'undefined')) {
      console.log('\nFound "MHX Holdings Verification" master task');
      console.log(`Current processId: ${mhxTask.processId}`);
      
      // Generate a processId based on the name
      const processId = 'mhx-holdings-verification';
      
      const result = await db.collection('masterTasks').updateOne(
        { _id: mhxTask._id },
        { $set: { processId: processId } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated processId to "${processId}"`);
        
        // Also update any domainTasks that reference this
        const domainTaskResult = await db.collection('domainTasks').updateMany(
          { masterTaskId: 'undefined', title: 'MHX Holdings Verification' },
          { $set: { masterTaskId: processId } }
        );
        
        if (domainTaskResult.modifiedCount > 0) {
          console.log(`✅ Updated ${domainTaskResult.modifiedCount} domainTask(s) to reference the correct masterTaskId`);
        }
      }
    }
    
    // Show final state
    console.log('\n=== Final Master Tasks State ===');
    const allMasterTasks = await db.collection('masterTasks').find({}).toArray();
    allMasterTasks.forEach(mt => {
      console.log(`- "${mt.name}" → processId: "${mt.processId}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixMasterTaskProcessId();