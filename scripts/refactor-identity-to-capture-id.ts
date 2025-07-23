#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function refactorIdentityToCaptureID() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('spark-ai');
    const processesCollection = db.collection('processes');
    const postsCollection = db.collection('posts');
    
    // 1. Update the process
    console.log('\n1. Updating identity-verification process...');
    
    // New simplified checklist without liveness detection
    const newChecklist = [
      {
        step: 1,
        order: 10,
        title: "Upload ID Document",
        description: "User uploads a clear photo of their government-issued ID card",
        type: "user_action",
        required: true,
        completed: false
      },
      {
        step: 2,
        order: 20,
        title: "AI Document Processing",
        description: "AI processes the ID card image using OCR technology",
        type: "ai_processing",
        required: true,
        completed: false
      },
      {
        step: 3,
        order: 30,
        title: "Extract Identity Fields",
        description: "AI extracts and validates structured data from the ID card",
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
          },
          {
            step: 3.6,
            order: 30.60,
            field: "gender",
            title: "Gender",
            description: "Extract gender from ID card",
            required: true
          }
        ]
      },
      {
        step: 4,
        order: 40,
        title: "Verify Document Authenticity",
        description: "AI verifies the document is authentic and not tampered with",
        type: "ai_verification",
        required: true,
        completed: false
      },
      {
        step: 5,
        order: 50,
        title: "Store Identity Data",
        description: "Securely store the verified identity information",
        type: "system_action",
        required: true,
        completed: false
      },
      {
        step: 6,
        order: 60,
        title: "Process Complete",
        description: "ID document capture and verification completed successfully",
        type: "completion",
        required: true,
        completed: false
      }
    ];

    // New intro message focused on ID capture
    const newIntro = `Welcome to the ID Document Capture Process! 📸

This process will capture and verify your government-issued ID document to establish your identity on our platform. We use advanced AI technology to securely process your information while maintaining compliance with data protection regulations.

**What we'll do together:**
1. 📷 **Document Upload** - You'll upload a clear photo of your government-issued ID
2. 🤖 **AI Processing** - Our AI will extract key information from your ID
3. ✅ **Field Verification** - We'll verify the extracted information
4. 🔐 **Secure Storage** - Your data will be securely stored

**What you need to do:**
Please upload a clear photo of your government-issued ID card. Make sure:
- The entire ID is visible in the frame
- The photo is well-lit and in focus
- All text on the ID is clearly readable
- The ID is valid and not expired
- No fingers or objects are covering any part of the ID

This process typically takes 5-10 minutes and your data is encrypted and stored securely.

Let's begin! Please upload your ID document now. 📸`;

    const processResult = await processesCollection.updateOne(
      { processId: "identity-verification" },
      { 
        $set: { 
          name: "Capture ID Document",
          description: "Capture and verify government-issued ID document for identity verification",
          intro: newIntro,
          checklist: newChecklist,
          sopMetadata: {
            complianceStandards: ["KYC", "AML", "FICA", "POPIA"],
            auditTrailRequired: true,
            regulatoryBody: "Financial Intelligence Centre",
            riskLevel: "medium",
            mandatorySteps: 6,
            estimatedDuration: "5-10 minutes"
          },
          aiAgentRole: "Document processing specialist performing OCR, data extraction, document authentication, and secure data storage",
          standardizationGoals: [
            "Ensure 100% accurate data extraction from ID documents",
            "Reduce document processing time to under 30 seconds",
            "Maintain compliance with data protection regulations",
            "Standardize ID capture across all domains"
          ],
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Process updated: ${processResult.modifiedCount} document(s) modified`);

    // 2. Update the master post
    console.log('\n2. Updating master post...');
    
    const postResult = await postsCollection.updateOne(
      { postType: "identity_verification" },
      {
        $set: {
          title: "Capture ID Document",
          description: "Upload your government-issued ID to verify your identity",
          content: "Complete the ID document capture process to unlock full platform access. This quick process ensures the security of our community.",
          ctaLabel: "Upload ID Document",
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Post updated: ${postResult.modifiedCount} document(s) modified`);

    // 3. Verify the updates
    console.log('\n3. Verifying updates...');
    
    const updatedProcess = await processesCollection.findOne({ processId: "identity-verification" });
    if (updatedProcess) {
      console.log('\n📋 Updated Process:');
      console.log(`- Name: ${updatedProcess.name}`);
      console.log(`- Checklist Steps: ${updatedProcess.checklist?.length || 0}`);
      console.log(`- Estimated Duration: ${updatedProcess.sopMetadata?.estimatedDuration}`);
    }

    const updatedPost = await postsCollection.findOne({ postType: "identity_verification" });
    if (updatedPost) {
      console.log('\n📮 Updated Post:');
      console.log(`- Title: ${updatedPost.title}`);
      console.log(`- CTA: ${updatedPost.ctaLabel}`);
    }

  } catch (error) {
    console.error('Error refactoring identity verification:', error);
  } finally {
    await client.close();
  }
}

// Run the script
refactorIdentityToCaptureID().catch(console.error);