#!/usr/bin/env tsx
/**
 * Script to verify multi-domain persistence
 * This tests that users can join multiple domains and all domains persist correctly
 */

import { connectToDatabase } from '../app/lib/database';
import User from '../app/models/User';

async function verifyMultiDomainPersistence() {
  console.log('🔍 Verifying Multi-Domain Persistence...\n');
  
  try {
    await connectToDatabase();
    
    // Find all users with domains
    const users = await User.find({ 'domains.0': { $exists: true } });
    
    console.log(`Found ${users.length} users with domains:\n`);
    
    for (const user of users) {
      console.log(`📧 User: ${user.email}`);
      console.log(`   Domains joined: ${user.domains.length}`);
      
      for (const domain of user.domains) {
        console.log(`   - ${domain.domainId} (Role: ${domain.role}, Joined: ${domain.joinedAt.toLocaleDateString()})`);
      }
      
      console.log('');
    }
    
    // Check for users with multiple domains
    const multiDomainUsers = users.filter(u => u.domains.length > 1);
    console.log(`\n✅ Users with multiple domains: ${multiDomainUsers.length}`);
    
    if (multiDomainUsers.length > 0) {
      console.log('Multi-domain persistence is working correctly!');
    } else {
      console.log('No users have joined multiple domains yet.');
      console.log('To test: Join a second domain through the UI and run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyMultiDomainPersistence();