#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function updateIdentityVerificationToSOP() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('spark-ai');
    const processesCollection = db.collection('processes');
    
    // Update the identity-verification process to SOP model
    const result = await processesCollection.updateOne(
      { processId: "identity-verification" },
      { 
        $set: { 
          executionModel: "sop",
          description: "Step-by-step identity verification procedure with compliance tracking and audit trail for platform access",
          category: "compliance", // Also update category to compliance
          sopMetadata: {
            complianceStandards: ["KYC", "AML", "FICA"],
            auditTrailRequired: true,
            regulatoryBody: "Financial Intelligence Centre",
            riskLevel: "high",
            mandatorySteps: 7,
            estimatedDuration: "15-20 minutes"
          },
          standardizationGoals: [
            "Ensure 100% compliance with KYC regulations",
            "Reduce identity fraud to less than 0.1%",
            "Create immutable audit trail for all verifications",
            "Standardize verification across all domains"
          ],
          aiAgentRole: "Compliance verification specialist performing document analysis, biometric matching, liveness detection, and risk assessment while maintaining audit trails",
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 1) {
      console.log('✅ Successfully updated identity-verification to SOP execution model');
      console.log(`Modified ${result.modifiedCount} document(s)`);
      
      // Verify the update
      const updatedProcess = await processesCollection.findOne({ processId: "identity-verification" });
      if (updatedProcess) {
        console.log('\n📋 Updated Process Details:');
        console.log(`- Name: ${updatedProcess.name}`);
        console.log(`- Execution Model: ${updatedProcess.executionModel}`);
        console.log(`- Category: ${updatedProcess.category}`);
        console.log(`- Description: ${updatedProcess.description}`);
        console.log(`- AI Role: ${updatedProcess.aiAgentRole}`);
        console.log(`- Checklist Steps: ${updatedProcess.checklist?.length || 0}`);
        
        if (updatedProcess.sopMetadata) {
          console.log('\n🔒 SOP Metadata:');
          console.log(`- Compliance Standards: ${updatedProcess.sopMetadata.complianceStandards.join(', ')}`);
          console.log(`- Risk Level: ${updatedProcess.sopMetadata.riskLevel}`);
          console.log(`- Mandatory Steps: ${updatedProcess.sopMetadata.mandatorySteps}`);
          console.log(`- Estimated Duration: ${updatedProcess.sopMetadata.estimatedDuration}`);
        }
      }
    } else {
      console.log('❌ No identity-verification process found');
    }
    
  } catch (error) {
    console.error('Error updating process:', error);
  } finally {
    await client.close();
  }
}

// Run the script
updateIdentityVerificationToSOP().catch(console.error);