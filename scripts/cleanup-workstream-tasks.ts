import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import Domain from '../app/models/Domain';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function cleanupAndFixWorkstreamTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, delete all domain-specific workstream tasks
    const deleteResult = await MasterTask.deleteMany({
      name: 'Create Workstream',
      domain: { $ne: '' }
    });
    console.log(`Deleted ${deleteResult.deletedCount} domain-specific workstream tasks`);

    // Find the master workstream task
    const masterTask = await MasterTask.findOne({
      name: 'Create Workstream',
      domain: ''
    });

    if (!masterTask) {
      console.error('Master workstream task not found');
      return;
    }

    console.log('Found master workstream task:', masterTask._id);

    // Get all active domains
    const domains = await Domain.find({ active: true });
    console.log(`Found ${domains.length} active domains`);

    // Build adoptedByDomains array
    const adoptedByDomains = domains.map(domain => ({
      domainId: domain._id.toString(),
      adoptedAt: new Date(),
      allowedRoles: ['admin', 'member'], // All domain members can create workstreams
      isActive: true,
      metrics: {
        executionCount: 0,
        averageCompletionTime: 0,
        successRate: 0
      }
    }));

    // Update the master task with adoptedByDomains
    masterTask.adoptedByDomains = adoptedByDomains;
    await masterTask.save();

    console.log(`Updated master task with ${adoptedByDomains.length} domain adoptions`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
cleanupAndFixWorkstreamTasks();