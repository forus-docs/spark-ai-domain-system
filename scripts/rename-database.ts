#!/usr/bin/env npx tsx
/**
 * Script to rename database from spark-ai to netbuild
 * This creates a new database and copies all collections
 */

import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const SOURCE_DB = 'spark-ai';
const TARGET_DB = 'netbuild';
const MONGODB_URI = 'mongodb://localhost:27017';

async function renameDatabase() {
  console.log(`🔄 Starting database rename from ${SOURCE_DB} to ${TARGET_DB}...`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);
    
    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections to copy`);
    
    // Copy each collection
    for (const collInfo of collections) {
      const collName = collInfo.name;
      console.log(`\n📋 Copying collection: ${collName}`);
      
      const sourceCollection = sourceDb.collection(collName);
      const targetCollection = targetDb.collection(collName);
      
      // Get all documents
      const documents = await sourceCollection.find({}).toArray();
      console.log(`  - Found ${documents.length} documents`);
      
      if (documents.length > 0) {
        // Insert documents into target collection
        await targetCollection.insertMany(documents);
        console.log(`  ✅ Copied ${documents.length} documents`);
      }
      
      // Copy indexes
      const indexes = await sourceCollection.indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') { // Skip default _id index
          const { name, ...indexSpec } = index;
          const keys = indexSpec.key;
          delete indexSpec.key;
          delete indexSpec.v;
          delete indexSpec.ns;
          
          try {
            await targetCollection.createIndex(keys, { ...indexSpec, name });
            console.log(`  ✅ Created index: ${name}`);
          } catch (err) {
            console.log(`  ⚠️  Failed to create index ${name}: ${err.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Database copy complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update .env.local: MONGODB_URI=mongodb://localhost:27017/netbuild');
    console.log('2. Update CLAUDE.md to reference "netbuild" database');
    console.log('3. Restart the development server');
    console.log('4. Test the application');
    console.log('5. If everything works, you can drop the old database:');
    console.log('   mongo --eval "db.dropDatabase()" spark-ai');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
renameDatabase().catch(console.error);