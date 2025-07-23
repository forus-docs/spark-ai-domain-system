#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function addIntroToIdentityVerification() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('spark-ai');
    const processesCollection = db.collection('processes');
    
    // Define the intro message for identity verification
    const introMessage = `Welcome to the Identity Verification Process! 🛡️

This workstream is designed to verify your identity in compliance with KYC (Know Your Customer), AML (Anti-Money Laundering), and FICA regulations. This process ensures the security and integrity of our platform while protecting all users from fraud.

**What we'll do together:**
1. 📷 **Document Upload** - You'll upload a clear photo of your government-issued ID
2. 🤖 **AI Processing** - Our AI will extract key information from your ID
3. ✅ **Verification** - We'll verify the extracted information
4. 🎥 **Liveness Check** - A quick video verification to ensure you're present
5. 🏁 **Completion** - Once verified, you'll have full access to the platform

**What you need to do first:**
Please upload a clear photo of your government-issued ID card. Make sure:
- The entire ID is visible in the frame
- The photo is well-lit and in focus
- All text on the ID is clearly readable
- The ID is valid and not expired

This process typically takes 15-20 minutes and creates a secure audit trail for compliance purposes.

Ready? Let's start by uploading your ID card! 📸`;

    // Update the identity-verification process with the intro
    const result = await processesCollection.updateOne(
      { processId: "identity-verification" },
      { 
        $set: { 
          intro: introMessage,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 1) {
      console.log('✅ Successfully added intro message to identity-verification process');
      console.log(`Modified ${result.modifiedCount} document(s)`);
      
      // Verify the update
      const updatedProcess = await processesCollection.findOne(
        { processId: "identity-verification" },
        { projection: { processId: 1, name: 1, intro: 1 } }
      );
      
      if (updatedProcess?.intro) {
        console.log('\n📝 Intro Message Preview:');
        console.log(updatedProcess.intro.substring(0, 200) + '...');
        console.log(`\nTotal length: ${updatedProcess.intro.length} characters`);
      }
    } else {
      console.log('❌ No identity-verification process found');
    }
    
  } catch (error) {
    console.error('Error adding intro:', error);
  } finally {
    await client.close();
  }
}

// Run the script
addIntroToIdentityVerification().catch(console.error);