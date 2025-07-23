#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function addIdentityVerificationChecklist() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('spark-ai');
    const processesCollection = db.collection('processes');
    
    // Define the checklist for identity verification
    const checklist = [
      {
        step: 1,
        order: 10,
        title: "User to load photo of ID Card",
        description: "User uploads a clear photo of their government-issued ID card",
        type: "user_action",
        required: true,
        completed: false
      },
      {
        step: 2,
        order: 20,
        title: "AI Assistant must OCR it",
        description: "AI processes the ID card image using OCR technology",
        type: "ai_processing",
        required: true,
        completed: false
      },
      {
        step: 3,
        order: 30,
        title: "AI Assistant must output fields",
        description: "AI extracts and presents structured data from the ID card",
        type: "ai_processing",
        required: true,
        completed: false,
        subSteps: [
          {
            step: 3.1,
            order: 30.10,
            field: "firstName",
            title: "First Name",
            description: "Extract first name from ID card",
            required: true
          },
          {
            step: 3.2,
            order: 30.20,
            field: "lastName", 
            title: "Last Name",
            description: "Extract last name from ID card",
            required: true
          },
          {
            step: 3.3,
            order: 30.30,
            field: "idNumber",
            title: "ID Number",
            description: "Extract ID number from ID card",
            required: true
          },
          {
            step: 3.4,
            order: 30.40,
            field: "dateOfBirth",
            title: "Date of Birth",
            description: "Extract date of birth from ID card",
            required: true
          },
          {
            step: 3.5,
            order: 30.50,
            field: "nationality",
            title: "Nationality",
            description: "Extract nationality from ID card",
            required: true
          }
        ]
      },
      {
        step: 4,
        order: 40,
        title: "Gender verification",
        description: "AI extracts gender information from ID card",
        type: "ai_processing",
        required: true,
        completed: false
      },
      {
        step: 5,
        order: 50,
        title: "AI must ask user to switch video and voice on",
        description: "AI instructs user to enable video and voice, say their name and surname, then disable video and voice",
        type: "user_interaction",
        required: true,
        completed: false
      },
      {
        step: 6,
        order: 60,
        title: "AI must verify Liveness",
        description: "AI performs liveness detection to ensure user is physically present",
        type: "ai_verification",
        required: true,
        completed: false
      },
      {
        step: 7,
        order: 70,
        title: "Task Complete",
        description: "Once all verification steps are complete, mark task as finished in chat stream",
        type: "completion",
        required: true,
        completed: false
      }
    ];
    
    // Update the identity-verification process document
    const result = await processesCollection.updateOne(
      { processId: "identity-verification" },
      { 
        $set: { 
          checklist: checklist,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 1) {
      console.log('✅ Successfully added checklist to identity-verification process');
      console.log(`Modified ${result.modifiedCount} document(s)`);
    } else {
      console.log('❌ No identity-verification process found');
    }
    
    // Verify the update
    const updatedProcess = await processesCollection.findOne({ processId: "identity-verification" });
    if (updatedProcess?.checklist) {
      console.log(`✅ Verification: Checklist added with ${updatedProcess.checklist.length} steps`);
    }
    
  } catch (error) {
    console.error('Error adding checklist:', error);
  } finally {
    await client.close();
  }
}

// Run the script
addIdentityVerificationChecklist().catch(console.error);