import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function updateWorkstreamTaskType() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all workstream tasks to use workstream_basic
    const updateResult = await MasterTask.updateMany(
      { 
        name: 'Create Workstream',
        taskType: 'workstream'
      },
      {
        $set: {
          taskType: 'workstream_basic',
          title: 'Create Workstream (Basic)'
        }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} tasks to workstream_basic`);

    // Verify the changes
    const updatedTasks = await MasterTask.find({
      name: 'Create Workstream',
      taskType: 'workstream_basic'
    }).select('_id domain taskType title');

    console.log('Updated tasks:');
    updatedTasks.forEach(task => {
      console.log(`- ${task._id}: domain=${task.domain || 'master'}, taskType=${task.taskType}, title="${task.title}"`);
    });

  } catch (error) {
    console.error('Error updating task types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateWorkstreamTaskType();