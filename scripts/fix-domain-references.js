const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function fixDomainReferences() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const domainTasksCollection = db.collection('domainTasks');

    // The correct Maven Hub domain ID
    const correctMavenHubId = '687a0856a04d21c05d2a6a12';
    const incorrectMavenHubId = '688341f2c8b4c21f6524ede5';

    console.log('Fixing domain references...');
    console.log('Incorrect ID:', incorrectMavenHubId);
    console.log('Correct ID:', correctMavenHubId);

    // Update all DomainTasks with the incorrect domain ID
    const result = await domainTasksCollection.updateMany(
      { domain: incorrectMavenHubId },
      { $set: { domain: correctMavenHubId } }
    );

    console.log(`\nUpdated ${result.modifiedCount} DomainTasks with correct Maven Hub domain ID`);

    // Verify the update
    const updatedTasks = await domainTasksCollection.find({ 
      domain: correctMavenHubId,
      isQMSCompliant: true 
    }).toArray();

    console.log(`\nVerified: Found ${updatedTasks.length} QMS-compliant tasks for Maven Hub`);
    updatedTasks.forEach(task => {
      console.log(`  ✓ ${task.title} (${task.taskType})`);
    });

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDomainReferences();