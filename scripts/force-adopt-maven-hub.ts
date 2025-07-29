import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function forceAdoptToMavenHub() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the Create Workstream MasterTask
    const masterTask = await MasterTask.findOne({
      name: 'Create Workstream',
      taskType: 'workstream',
      domain: ''
    });

    if (!masterTask) {
      console.error('Create Workstream MasterTask not found');
      return;
    }

    console.log('Found Create Workstream MasterTask:', masterTask._id);

    // Maven Hub domain ID
    const mavenHubDomainId = '688341f2c8b4c21f6524ede5';

    // Check if DomainTask already exists
    const existingDomainTask = await MasterTask.findOne({
      domain: mavenHubDomainId,
      masterTaskId: masterTask.masterTaskId
    });

    if (existingDomainTask) {
      console.log('DomainTask already exists for Maven Hub:', existingDomainTask._id);
      return;
    }

    // Create DomainTask for Maven Hub
    const domainTask = new MasterTask({
      ...masterTask.toObject(),
      _id: new mongoose.Types.ObjectId(),
      domain: mavenHubDomainId,
      domainTaskId: uuidv4(),
      adoptedAt: new Date(),
      adoptedBy: 'system',
      adoptionNotes: 'Force-adopted for workstream functionality',
      // Keep the original masterTaskId to track lineage
      masterTaskId: masterTask.masterTaskId,
      // Clear user-specific fields
      userId: '',
      assignedTo: '',
      assignedBy: '',
      timestampAssigned: null,
      // Domain customizations (none for workstreams)
      domainCustomizations: null
    });

    await domainTask.save();
    console.log(`Created DomainTask for Maven Hub with ID: ${domainTask._id}`);

  } catch (error) {
    console.error('Error during force adoption:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
forceAdoptToMavenHub();