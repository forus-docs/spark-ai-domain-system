import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import DomainTask from '../app/models/DomainTask';
import Domain from '../app/models/Domain';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function autoAdoptWorkstreamTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the workstream master task
    const workstreamMasterTask = await MasterTask.findOne({
      taskType: 'workstream_basic'
    });

    if (!workstreamMasterTask) {
      console.error('Workstream master task not found!');
      console.log('Please run: npx tsx scripts/add-workstream-master-task.ts first');
      return;
    }

    console.log('Found workstream master task:', workstreamMasterTask.name);

    // Get all domains
    const domains = await Domain.find({});
    console.log(`Found ${domains.length} domains`);

    for (const domain of domains) {
      // Check if already adopted
      const existingDomainTask = await DomainTask.findOne({
        domain: domain._id,
        taskType: 'workstream_basic'
      });

      if (existingDomainTask) {
        console.log(`✓ Workstream task already adopted for domain: ${domain.name}`);
        continue;
      }

      // Create domain task from master task
      const domainTaskData = {
        ...workstreamMasterTask.toObject(),
        _id: undefined, // Remove the master task ID
        masterTaskId: workstreamMasterTask.masterTaskId,
        domain: domain._id,
        adoptedAt: new Date(),
        adoptedBy: domain.createdBy || 'system',
        adoptionNotes: 'Auto-adopted for workstream functionality',
        domainMetrics: {
          totalExecutions: 0,
          averageCompletionTime: 0,
          averageSuccessRate: 0,
          lastExecuted: null
        }
      };

      const domainTask = new DomainTask(domainTaskData);
      await domainTask.save();

      console.log(`✓ Adopted workstream task to domain: ${domain.name}`);
    }

    console.log('\nWorkstream task adoption complete!');

  } catch (error) {
    console.error('Error adopting workstream task:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
autoAdoptWorkstreamTask();