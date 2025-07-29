import mongoose from 'mongoose';
import DomainTask from '../app/models/DomainTask';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function testWorkstreamLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test different domain IDs
    const testDomainIds = [
      '688341f2c8b4c21f6524ede5', // Maven Hub
      '688341f2c8b4c21f6524edf4', // Wealth on Wheels
      '688341f2c8b4c21f6524ee04', // Bemnet
      '688341f2c8b4c21f6524ee14'  // PACCI
    ];

    console.log('\n=== Testing Domain Task Lookups ===\n');

    for (const domainId of testDomainIds) {
      console.log(`\nTesting domain: ${domainId}`);
      
      // Method 1: Direct string query
      const task1 = await DomainTask.findOne({
        domain: domainId,
        taskType: 'workstream_basic'
      });
      console.log(`Method 1 (string): ${task1 ? 'FOUND' : 'NOT FOUND'}`);
      if (task1) {
        console.log(`  - Task ID: ${task1._id}`);
        console.log(`  - Name: ${task1.name}`);
        console.log(`  - Domain field value: "${task1.domain}"`);
        console.log(`  - Domain field type: ${typeof task1.domain}`);
      }

      // Method 2: Count documents
      const count = await DomainTask.countDocuments({
        domain: domainId,
        taskType: 'workstream_basic'
      });
      console.log(`Method 2 (count): ${count} documents`);

      // Method 3: Find all tasks in domain
      const allTasks = await DomainTask.find({ domain: domainId }).select('name taskType');
      console.log(`Total tasks in domain: ${allTasks.length}`);
      allTasks.forEach(t => {
        console.log(`  - ${t.name} (${t.taskType})`);
      });
    }

    // Check all workstream tasks
    console.log('\n=== All Workstream Tasks ===\n');
    const allWorkstreamTasks = await DomainTask.find({ taskType: 'workstream_basic' });
    console.log(`Total workstream tasks: ${allWorkstreamTasks.length}`);
    allWorkstreamTasks.forEach(task => {
      console.log(`- Domain: "${task.domain}" (type: ${typeof task.domain}), Name: ${task.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testWorkstreamLookup();