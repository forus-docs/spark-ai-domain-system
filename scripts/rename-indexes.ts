import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

// Define readable index names for all collections
const INDEX_RENAMES = {
  masterTasks: {
    'domain_1_isActive_1': 'idx_domain_active',
    'domain_1_isActive_1_priority_-1': 'idx_domain_active_priority',
    'isActive_1_domain_1': 'idx_active_domain',
    'userId_1_domain_1_isActive_1': 'idx_user_domain_active',
    'adoptedByDomains.domainId_1': 'idx_adopted_domains',
    'category_1_executionModel_1': 'idx_category_model',
    'adoptedByDomains.domainId_1_adoptedByDomains.isActive_1': 'idx_adopted_domains_active',
    'userId_1_isCompleted_1': 'idx_user_completed',
    'assignedTo_1_timestampAssigned_-1': 'idx_assigned_to_time',
    'assignedBy_1_timestampAssigned_-1': 'idx_assigned_by_time',
    'name_text_description_text': 'idx_text_search',
    'domain_1': 'idx_domain',
    'userId_1': 'idx_user',
    'masterTaskId_1': 'idx_master_task',
    'masterTaskId_1_domain_1': 'idx_master_task_domain',
    'assignedTo_1': 'idx_assigned_to',
  },
  
  taskExecutions: {
    'userId_1_createdAt_-1': 'idx_user_recent',
    'executionId_1': 'idx_execution_id',
    'domainTaskId_1': 'idx_domain_task',
    'userId_1_status_1': 'idx_user_status',
    'domainId_1_userId_1': 'idx_domain_user',
    'userId_1_domainId_1_status_1': 'idx_user_domain_status',
    'domain_1_userId_1_createdAt_-1': 'idx_domain_user_recent',
    'userTaskId_1_createdAt_-1': 'idx_user_task_recent',
    'userTaskId_1': 'idx_user_task',
  },
  
  executionMessages: {
    'messageId_1': 'idx_message_id',
    'executionId_1_createdAt_1': 'idx_execution_time',
    'executionId_1_role_1': 'idx_execution_role',
    'userId_1_createdAt_-1': 'idx_user_recent',
    'parentMessageId_1': 'idx_parent_message',
  },
  
  domains: {
    'slug_1': 'idx_slug',
    'active_1': 'idx_active',
    'createdBy_1': 'idx_creator',
    'name_1': 'idx_name',
  },
  
  users: {
    'email_1': 'idx_email',
    'domains.domain_1': 'idx_user_domains',
    'identity.isVerified_1': 'idx_verified',
  },
  
  domainTasks: {
    'domain_1': 'idx_domain',
    'isActive_1': 'idx_active',
    'domain_1_isActive_1_priority_-1': 'idx_domain_active_priority',
    'masterTaskId_1': 'idx_master_task',
    'originalMasterTaskId_1': 'idx_original_master',
    'isActiveInDomain_1': 'idx_active_in_domain',
    'domain_1_taskType_1_isActive_1': 'idx_domain_type_active',
    'masterTaskId_1_domain_1': 'idx_master_domain',
  },
  
  userTasks: {
    'userId_1': 'idx_user',
    'userId_1_domainTaskId_1': 'idx_user_domain_task',
    'masterTaskId_1': 'idx_master_task',
    'userId_1_isCompleted_1_isHidden_1_timestampAssigned_-1': 'idx_user_tasks_sorted',
    'assignedTo_1_timestampAssigned_-1': 'idx_assigned_sorted',
    'assignedTo_1': 'idx_assigned_to',
  },
};

async function renameIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    for (const [collectionName, renames] of Object.entries(INDEX_RENAMES)) {
      console.log(`\n=== Processing ${collectionName} ===`);
      
      try {
        const collection = db.collection(collectionName);
        const currentIndexes = await collection.indexes();
        
        for (const index of currentIndexes) {
          const oldName = index.name;
          const newName = renames[oldName];
          
          // Skip _id index and already renamed indexes
          if (oldName === '_id_' || !newName || oldName.startsWith('idx_')) {
            continue;
          }
          
          console.log(`Renaming: ${oldName} → ${newName}`);
          
          try {
            // Create new index with readable name
            await collection.createIndex(index.key, { 
              ...index,
              name: newName,
              background: true 
            });
            
            // Drop old index
            await collection.dropIndex(oldName);
            console.log(`  ✓ Success`);
          } catch (err: any) {
            if (err.code === 85) {
              console.log(`  - Index ${newName} already exists`);
            } else if (err.code === 27) {
              console.log(`  - Old index ${oldName} not found`);
            } else {
              console.error(`  ✗ Error: ${err.message}`);
            }
          }
        }
      } catch (err: any) {
        console.log(`  Collection ${collectionName} not found`);
      }
    }

    // Show final index status
    console.log('\n=== Final Index Status ===');
    
    for (const collectionName of Object.keys(INDEX_RENAMES)) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        
        console.log(`\n${collectionName}:`);
        for (const index of indexes) {
          if (index.name !== '_id_') {
            const indicator = index.name.startsWith('idx_') ? '✓' : '⚠';
            console.log(`  ${indicator} ${index.name}`);
          }
        }
      } catch (err) {
        // Collection doesn't exist
      }
    }

    console.log('\n✅ Index renaming complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
renameIndexes();