const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function deleteOrphanedDomainTasks() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== Finding orphaned domainTasks ===\n');
    
    // Find domainTasks with invalid masterTaskId references
    const orphanedDomainTasks = await db.collection('domainTasks').aggregate([
      { $match: { masterTaskId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'masterTasks',
          localField: 'masterTaskId',
          foreignField: 'masterTaskId',
          as: 'referenced'
        }
      },
      { $match: { referenced: { $size: 0 } } },
      { $project: { _id: 1, title: 1, masterTaskId: 1, domain: 1 } }
    ]).toArray();
    
    if (orphanedDomainTasks.length === 0) {
      console.log('No orphaned domainTasks found.');
      return;
    }
    
    console.log(`Found ${orphanedDomainTasks.length} orphaned domainTasks:\n`);
    
    // Display the tasks to be deleted
    orphanedDomainTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   - ID: ${task._id}`);
      console.log(`   - Domain: ${task.domain}`);
      console.log(`   - References non-existent masterTask: ${task.masterTaskId}\n`);
    });
    
    // Delete the orphaned tasks
    console.log('=== Deleting orphaned domainTasks ===\n');
    
    const idsToDelete = orphanedDomainTasks.map(task => task._id);
    
    const deleteResult = await db.collection('domainTasks').deleteMany({
      _id: { $in: idsToDelete }
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned domainTasks\n`);
    
    // Verify the deletion
    console.log('=== Verifying deletion ===\n');
    
    // Check again for orphaned tasks
    const remainingOrphaned = await db.collection('domainTasks').aggregate([
      { $match: { masterTaskId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'masterTasks',
          localField: 'masterTaskId',
          foreignField: 'masterTaskId',
          as: 'referenced'
        }
      },
      { $match: { referenced: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    
    const remainingCount = remainingOrphaned[0]?.count || 0;
    
    if (remainingCount === 0) {
      console.log('✅ All orphaned domainTasks have been successfully deleted.');
      console.log('✅ All remaining domainTasks have valid masterTask references.');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} orphaned domainTasks still remain.`);
    }
    
    // Show final stats
    console.log('\n=== Final Statistics ===\n');
    
    const totalDomainTasks = await db.collection('domainTasks').countDocuments();
    const domainTasksWithMasterTask = await db.collection('domainTasks').countDocuments({ 
      masterTaskId: { $exists: true, $ne: null } 
    });
    
    console.log(`Total domainTasks: ${totalDomainTasks}`);
    console.log(`DomainTasks with masterTaskId: ${domainTasksWithMasterTask}`);
    console.log(`DomainTasks without masterTaskId: ${totalDomainTasks - domainTasksWithMasterTask}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the deletion
deleteOrphanedDomainTasks();