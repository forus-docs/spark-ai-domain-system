const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function checkMavenHubTasks() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== Checking maven-hub domain tasks ===\n');
    
    // Get all domain tasks for maven-hub
    const mavenHubTasks = await db.collection('domainTasks').find({
      $or: [
        { domain: 'maven-hub' },
        { domain: 'all' }
      ],
      isActive: true
    }).toArray();
    
    console.log(`Found ${mavenHubTasks.length} tasks for maven-hub domain:\n`);
    
    mavenHubTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   - ID: ${task._id}`);
      console.log(`   - Domain: ${task.domain}`);
      console.log(`   - Task Type: ${task.taskType}`);
      console.log(`   - Category: ${task.category}`);
      console.log(`   - Priority: ${task.priority}`);
      console.log(`   - Has MasterTaskId: ${task.masterTaskId ? 'Yes (' + task.masterTaskId + ')' : 'No'}`);
      console.log('');
    });
    
    // Check if there are any userTasks already assigned
    console.log('=== Checking existing user task assignments ===\n');
    
    const userTaskCount = await db.collection('userTasks').countDocuments();
    console.log(`Total userTasks in database: ${userTaskCount}`);
    
    if (userTaskCount > 0) {
      const userTasks = await db.collection('userTasks').find({}).toArray();
      console.log('\nUser task assignments:');
      userTasks.forEach(ut => {
        console.log(`- User: ${ut.userId}, DomainTaskId: ${ut.domainTaskId}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkMavenHubTasks();