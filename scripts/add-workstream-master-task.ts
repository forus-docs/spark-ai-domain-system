import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function addWorkstreamMasterTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if workstream master task already exists
    const existingTask = await MasterTask.findOne({
      name: 'Create Workstream',
      taskType: 'workstream'
    });

    if (existingTask) {
      console.log('Create Workstream MasterTask already exists');
      return;
    }

    // Create the workstream master task
    const workstreamTask = new MasterTask({
      masterTaskId: uuidv4(),
      name: 'Create Workstream',
      title: 'Create Workstream (Basic)',
      description: 'Create a collaborative workstream for team communication and coordination',
      category: 'operational',
      taskType: 'workstream_basic',
      executionModel: 'knowledge', // Using knowledge model for workstreams
      currentStage: 'automated',
      isActive: true,
      
      // Minimal configuration for workstreams
      taskSnapshot: {
        title: 'Create Workstream (Basic)',
        description: 'Collaborative team workstream',
        taskType: 'workstream_basic',
        executionModel: 'knowledge'
      },
      
      // System prompt for workstream conversations
      systemPrompt: 'You are a helpful assistant facilitating team collaboration in this workstream. Help team members communicate effectively, track action items, and coordinate their work.',
      
      // No procedures needed for workstreams
      procedures: [],
      
      // Basic metadata
      metadata: {
        version: '1.0',
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        owner: 'system',
        approvedBy: 'system'
      }
    });

    await workstreamTask.save();
    console.log('Created "Create Workstream" MasterTask successfully');
    console.log('MasterTask ID:', workstreamTask._id);

  } catch (error) {
    console.error('Error creating workstream master task:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addWorkstreamMasterTask();