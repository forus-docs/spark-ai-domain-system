import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

// Define all indexes with proper names
const INDEXES = {
  masterTasks: [
    { spec: { domain: 1, isActive: 1 }, options: { name: 'idx_domain_active' } },
    { spec: { domain: 1, isActive: 1, priority: -1 }, options: { name: 'idx_domain_active_priority' } },
    { spec: { isActive: 1, domain: 1 }, options: { name: 'idx_active_domain' } },
    { spec: { userId: 1, domain: 1, isActive: 1 }, options: { name: 'idx_user_domain_active' } },
    { spec: { 'adoptedByDomains.domainId': 1 }, options: { name: 'idx_adopted_domains' } },
    { spec: { category: 1, executionModel: 1 }, options: { name: 'idx_category_model' } },
    { spec: { 'adoptedByDomains.domainId': 1, 'adoptedByDomains.isActive': 1 }, options: { name: 'idx_adopted_domains_active' } },
    { spec: { userId: 1, isCompleted: 1 }, options: { name: 'idx_user_completed' } },
    { spec: { assignedTo: 1, timestampAssigned: -1 }, options: { name: 'idx_assigned_to_time' } },
    { spec: { assignedBy: 1, timestampAssigned: -1 }, options: { name: 'idx_assigned_by_time' } },
    { spec: { name: 'text', description: 'text' }, options: { name: 'idx_text_search' } },
  ],
  
  taskExecutions: [
    { spec: { userId: 1, createdAt: -1 }, options: { name: 'idx_user_recent' } },
    { spec: { domainTaskId: 1 }, options: { name: 'idx_domain_task' } },
    { spec: { userId: 1, status: 1 }, options: { name: 'idx_user_status' } },
    { spec: { domainId: 1, userId: 1 }, options: { name: 'idx_domain_user' } },
    { spec: { userId: 1, domainId: 1, status: 1 }, options: { name: 'idx_user_domain_status' } },
  ],
  
  executionMessages: [
    { spec: { executionId: 1, createdAt: 1 }, options: { name: 'idx_execution_time' } },
    { spec: { executionId: 1, role: 1 }, options: { name: 'idx_execution_role' } },
    { spec: { userId: 1, createdAt: -1 }, options: { name: 'idx_user_recent' } },
    { spec: { parentMessageId: 1 }, options: { name: 'idx_parent_message' } },
  ],
  
  domains: [
    { spec: { active: 1 }, options: { name: 'idx_active' } },
    { spec: { createdBy: 1 }, options: { name: 'idx_creator' } },
    { spec: { name: 'text', description: 'text' }, options: { name: 'idx_text_search' } },
  ],
  
  users: [
    { spec: { 'domains.domain': 1 }, options: { name: 'idx_user_domains' } },
    { spec: { 'identity.isVerified': 1 }, options: { name: 'idx_verified' } },
  ],
  
  invites: [
    { spec: { status: 1, expiresAt: 1 }, options: { name: 'idx_active_invites' } },
    { spec: { domainId: 1, roleId: 1 }, options: { name: 'idx_domain_role' } },
    { spec: { createdBy: 1 }, options: { name: 'idx_creator' } },
  ],
};

async function createNamedIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // First, drop all non-system indexes
    console.log('\n=== Dropping old indexes ===');
    for (const collectionName of Object.keys(INDEXES)) {
      try {
        const collection = db.collection(collectionName);
        const currentIndexes = await collection.indexes();
        
        for (const index of currentIndexes) {
          if (index.name !== '_id_' && !index.name.startsWith('idx_')) {
            console.log(`Dropping ${collectionName}.${index.name}`);
            await collection.dropIndex(index.name);
          }
        }
      } catch (err) {
        console.log(`Collection ${collectionName} not found`);
      }
    }

    // Create new indexes with proper names
    console.log('\n=== Creating indexes with proper names ===');
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      console.log(`\n${collectionName}:`);
      
      try {
        const collection = db.collection(collectionName);
        
        for (const { spec, options } of indexes) {
          try {
            await collection.createIndex(spec, { ...options, background: true });
            console.log(`  ✓ ${options.name}`);
          } catch (err: any) {
            if (err.code === 85 || err.code === 86) {
              console.log(`  - ${options.name} already exists`);
            } else {
              console.error(`  ✗ ${options.name}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.log(`  Collection not found`);
      }
    }

    // Show final status
    console.log('\n=== Final Index Status ===');
    const collections = await db.listCollections().toArray();
    
    for (const collInfo of collections) {
      if (INDEXES[collInfo.name]) {
        const collection = db.collection(collInfo.name);
        const indexes = await collection.indexes();
        
        console.log(`\n${collInfo.name}: ${indexes.length} indexes`);
        for (const index of indexes) {
          if (index.name !== '_id_') {
            console.log(`  ${index.name}`);
          }
        }
      }
    }

    console.log('\n✅ Index creation complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createNamedIndexes();