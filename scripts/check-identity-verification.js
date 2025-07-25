const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function checkIdentityVerification() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== Checking for identity verification tasks ===\n');
    
    // Check domainTasks
    const domainTasks = await db.collection('domainTasks').find({
      taskType: 'identity_verification'
    }).toArray();
    
    console.log(`Found ${domainTasks.length} identity verification domain tasks:`);
    domainTasks.forEach(task => {
      console.log(`\n- Title: ${task.title}`);
      console.log(`  ID: ${task._id}`);
      console.log(`  masterTaskId: ${task.masterTaskId}`);
      console.log(`  ctaAction: ${JSON.stringify(task.ctaAction)}`);
    });
    
    console.log('\n=== Checking for master tasks ===\n');
    
    // Check masterTasks with processId = 'identity-verification'
    const masterTaskByProcessId = await db.collection('masterTasks').findOne({
      processId: 'identity-verification'
    });
    
    if (masterTaskByProcessId) {
      console.log('Found master task with processId "identity-verification":');
      console.log(`- Name: ${masterTaskByProcessId.name}`);
      console.log(`- ID: ${masterTaskByProcessId._id}`);
    } else {
      console.log('No master task found with processId "identity-verification"');
      
      // Check all master tasks
      const allMasterTasks = await db.collection('masterTasks').find({}).toArray();
      console.log(`\nTotal master tasks in database: ${allMasterTasks.length}`);
      
      if (allMasterTasks.length > 0) {
        console.log('\nAvailable master tasks:');
        allMasterTasks.forEach(mt => {
          console.log(`- processId: "${mt.processId}" - ${mt.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkIdentityVerification();