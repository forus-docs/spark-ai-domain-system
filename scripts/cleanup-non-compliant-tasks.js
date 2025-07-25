const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

/**
 * Cleanup Script: Remove Non-QMS-Compliant DomainTasks
 * 
 * This script removes old domainTasks that don't have the QMS-compliant
 * masterTaskSnapshot structure. It should only be run after verifying
 * that all userTasks have been updated to reference new QMS-compliant tasks.
 * 
 * Run with: node scripts/cleanup-non-compliant-tasks.js
 */

async function cleanupNonCompliantTasks() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== CLEANUP NON-COMPLIANT TASKS ===\n');
    
    // 1. First, verify we have QMS-compliant tasks
    const compliantTasks = await db.collection('domainTasks')
      .find({ isQMSCompliant: true })
      .toArray();
    
    console.log(`Found ${compliantTasks.length} QMS-compliant domainTasks`);
    
    if (compliantTasks.length === 0) {
      console.log('\nERROR: No QMS-compliant tasks found. Aborting cleanup.');
      return;
    }
    
    // 2. Find non-compliant tasks
    const nonCompliantTasks = await db.collection('domainTasks')
      .find({ 
        $or: [
          { isQMSCompliant: false },
          { isQMSCompliant: { $exists: false } }
        ]
      })
      .toArray();
    
    console.log(`\nFound ${nonCompliantTasks.length} non-compliant domainTasks to remove`);
    
    if (nonCompliantTasks.length === 0) {
      console.log('No non-compliant tasks to clean up!');
      return;
    }
    
    // 3. Check if any userTasks still reference non-compliant domainTasks
    const nonCompliantTaskIds = nonCompliantTasks.map(t => t._id.toString());
    const affectedUserTasks = await db.collection('userTasks')
      .find({ 
        domainTaskId: { $in: nonCompliantTaskIds }
      })
      .toArray();
    
    if (affectedUserTasks.length > 0) {
      console.log(`\nWARNING: Found ${affectedUserTasks.length} userTasks still referencing non-compliant domainTasks`);
      console.log('These userTasks need to be updated first. Details:');
      
      for (const ut of affectedUserTasks) {
        const domainTask = nonCompliantTasks.find(t => t._id.toString() === ut.domainTaskId);
        console.log(`- UserTask ${ut._id}: references domainTask "${domainTask?.title}" (${ut.domainTaskId})`);
      }
      
      console.log('\nPlease run the migration script again or manually update these userTasks.');
      return;
    }
    
    // 4. List tasks to be deleted
    console.log('\nTasks to be deleted:');
    for (const task of nonCompliantTasks) {
      console.log(`- ${task.title} (${task._id}) - domain: ${task.domain}`);
    }
    
    // 5. Ask for confirmation
    console.log('\nThis action is irreversible.');
    console.log('Press Ctrl+C to abort, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Delete non-compliant tasks
    console.log('\nDeleting non-compliant tasks...');
    const deleteResult = await db.collection('domainTasks').deleteMany({
      $or: [
        { isQMSCompliant: false },
        { isQMSCompliant: { $exists: false } }
      ]
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} non-compliant domainTasks`);
    
    // 7. Verify final state
    const remainingTasks = await db.collection('domainTasks').find({}).toArray();
    const allCompliant = remainingTasks.every(t => t.isQMSCompliant === true);
    
    console.log(`\n=== CLEANUP COMPLETE ===`);
    console.log(`Total domainTasks remaining: ${remainingTasks.length}`);
    console.log(`All remaining tasks are QMS-compliant: ${allCompliant ? 'YES ✓' : 'NO ✗'}`);
    
    if (!allCompliant) {
      console.log('\nWARNING: Some non-compliant tasks may still exist. Please investigate.');
    }
    
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the cleanup
cleanupNonCompliantTasks();