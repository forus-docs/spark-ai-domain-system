import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function optimizeIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Define optimal indexes for each collection based on common queries
    const indexOptimizations = {
      // MasterTask indexes (unified schema)
      masterTasks: {
        drop: [
          'domain_1_active_1', // Replaced by compound index
          'domain_1_priority_-1', // Less specific than needed
        ],
        create: [
          { 'domain': 1, 'isActive': 1 }, // Domain tasks that are active
          { 'domain': 1, 'isActive': 1, 'priority': -1 }, // For sorted domain tasks
          { 'isActive': 1, 'domain': 1 }, // Templates (domain null/empty)
          { 'userId': 1, 'domain': 1, 'isActive': 1 }, // User tasks by domain
        ]
      },

      // TaskExecution indexes
      taskExecutions: {
        drop: [
          'userId_1', // Covered by compound indexes
          'domainId_1', // Covered by compound indexes
          'masterTaskId_1', // No longer used
          'userId_1_masterTaskId_1', // No longer used
        ],
        create: [
          { 'userId': 1, 'createdAt': -1 }, // Recent executions
          { 'executionId': 1 }, // Unique lookup
          { 'domainTaskId': 1 }, // Find by source task
          { 'userId': 1, 'status': 1 }, // User tasks by status
          { 'domain': 1, 'userId': 1, 'createdAt': -1 }, // Domain-scoped recent
        ]
      },

      // ExecutionMessage indexes
      executionMessages: {
        drop: [
          'userId_1', // Less useful alone
        ],
        create: [
          { 'executionId': 1, 'createdAt': 1 }, // Messages in order
          { 'executionId': 1, 'role': 1 }, // Messages by role
          { 'messageId': 1 }, // Unique lookup
        ]
      },

      // Domain indexes
      domains: {
        create: [
          { 'slug': 1 }, // Lookup by slug
          { 'active': 1 }, // Active domains
          { 'createdBy': 1 }, // Domains by creator
        ]
      },

      // User indexes
      users: {
        create: [
          { 'email': 1 }, // Login lookup
          { 'domains.domain': 1 }, // Find users by domain
          { 'identity.isVerified': 1 }, // Verified users
        ]
      }
    };

    // Process each collection
    for (const [collection, ops] of Object.entries(indexOptimizations)) {
      console.log(`\n=== Optimizing ${collection} ===`);
      
      // Drop unnecessary indexes
      if (ops.drop) {
        for (const indexName of ops.drop) {
          try {
            await db.collection(collection).dropIndex(indexName);
            console.log(`✓ Dropped index: ${indexName}`);
          } catch (err: any) {
            if (err.code === 27) {
              console.log(`- Index ${indexName} doesn't exist`);
            } else {
              console.error(`✗ Error dropping ${indexName}:`, err.message);
            }
          }
        }
      }

      // Create new indexes
      if (ops.create) {
        for (const indexSpec of ops.create) {
          try {
            const indexName = Object.entries(indexSpec)
              .map(([k, v]) => `${k}_${v}`)
              .join('_');
            
            await db.collection(collection).createIndex(indexSpec);
            console.log(`✓ Created index: ${indexName}`);
          } catch (err: any) {
            if (err.code === 11000 || err.code === 85) {
              console.log(`- Index already exists: ${JSON.stringify(indexSpec)}`);
            } else {
              console.error(`✗ Error creating index:`, err.message);
            }
          }
        }
      }
    }

    // Analyze index usage
    console.log('\n=== Current Index Analysis ===');
    
    // Get actual collection names
    const collectionNames = await db.listCollections().toArray();
    const collections = collectionNames.map(c => c.name).filter(name => 
      ['masterTasks', 'taskExecutions', 'executionMessages', 'domains', 'users'].includes(name)
    );
    
    for (const collection of collections) {
      try {
        const indexes = await db.collection(collection).indexes();
        const stats = await db.collection(collection).stats();
        
        console.log(`\n${collection}:`);
        console.log(`  Document count: ${stats.count}`);
        console.log(`  Total indexes: ${indexes.length}`);
        console.log(`  Index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        
        // List indexes
        indexes.forEach(idx => {
          if (idx.name !== '_id_') {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
          }
        });
      } catch (err) {
        console.log(`  Collection ${collection} not found`);
      }
    }

    console.log('\n✅ Index optimization complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the optimization
optimizeIndexes();