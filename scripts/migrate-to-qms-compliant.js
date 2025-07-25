const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

/**
 * Migration Script: Create QMS-Compliant DomainTasks
 * 
 * This script creates new QMS-compliant domainTasks from existing masterTasks.
 * The new domainTasks will contain complete snapshots of masterTask data,
 * eliminating the need for dynamic fetching during execution.
 * 
 * Run with: node scripts/migrate-to-qms-compliant.js
 */

async function migrateToQMSCompliant() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== QMS COMPLIANCE MIGRATION ===\n');
    
    // 1. Get all active masterTasks
    const masterTasks = await db.collection('masterTasks').find({ active: true }).toArray();
    console.log(`Found ${masterTasks.length} active masterTasks to migrate\n`);
    
    // 2. Create mapping of task types
    const taskTypeMapping = {
      'identity': 'identity_verification',
      'onboarding': 'onboarding',
      'training': 'training',
      'operational': 'task',
      'compliance': 'compliance',
      'financial': 'task'
    };
    
    // 3. Create QMS-compliant domainTasks for maven-hub domain
    const newDomainTasks = [];
    
    for (const masterTask of masterTasks) {
      console.log(`Processing: ${masterTask.name} (${masterTask.masterTaskId || masterTask.processId})`);
      
      // Determine appropriate task type
      const taskType = taskTypeMapping[masterTask.category] || 'task';
      
      // Create display metadata based on masterTask
      const displayConfig = getDisplayConfig(masterTask);
      
      // Build complete snapshot
      const domainTask = {
        // Domain-specific fields
        domain: 'maven-hub', // Creating for maven-hub domain
        title: masterTask.name,
        description: masterTask.description,
        taskType: taskType,
        
        // References (for audit trail)
        masterTaskId: masterTask.masterTaskId || masterTask.processId || masterTask._id.toString(),
        masterTaskVersion: masterTask.standardOperatingProcedure?.metadata?.version || '1.0.0',
        
        // Complete MasterTask snapshot (QMS Compliant)
        masterTaskSnapshot: {
          name: masterTask.name,
          category: masterTask.category,
          executionModel: masterTask.executionModel,
          currentStage: masterTask.currentStage,
          
          // AI Configuration
          aiAgentAttached: masterTask.aiAgentAttached || false,
          aiAgentRole: masterTask.aiAgentRole,
          aiAgentId: masterTask.aiAgentId,
          systemPrompt: masterTask.systemPrompt,
          intro: masterTask.intro,
          
          // Execution data
          standardOperatingProcedure: masterTask.standardOperatingProcedure,
          contextDocuments: masterTask.contextDocuments || [],
          requiredParameters: masterTask.requiredParameters || [],
          checklist: masterTask.checklist || [],
          
          // Form/workflow/training data
          formSchema: masterTask.formSchema,
          validationRules: masterTask.validationRules,
          workflowDefinition: masterTask.workflowDefinition,
          curriculum: masterTask.curriculum || [],
          
          // Metadata
          sopMetadata: masterTask.sopMetadata || {}
        },
        
        // Domain customizations (none for initial migration)
        domainCustomizations: {},
        
        // Adoption metadata
        adoptedAt: new Date(),
        adoptedBy: 'migration-script',
        adoptionNotes: 'Migrated to QMS-compliant structure',
        
        // Display configuration
        ...displayConfig,
        
        // Task behavior
        requiresIdentityVerification: masterTask.category !== 'identity',
        prerequisiteTasks: [],
        nextTasks: [],
        canHide: true,
        priority: 'normal',
        category: masterTask.category === 'identity' ? 'required' : 'recommended',
        
        // Additional metadata
        estimatedTime: masterTask.sopMetadata?.estimatedDuration || '30 minutes',
        version: '1.0.0',
        
        // Status flags
        isActive: true,
        isQMSCompliant: true,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Special handling for identity verification
      if (masterTask.category === 'identity') {
        domainTask.ctaAction.type = 'process';
        domainTask.priority = 'urgent';
        domainTask.category = 'required';
      }
      
      newDomainTasks.push(domainTask);
    }
    
    // 4. Mark existing domainTasks as non-compliant
    console.log('\nMarking existing domainTasks as non-compliant...');
    await db.collection('domainTasks').updateMany(
      { isQMSCompliant: { $ne: true } },
      { $set: { isQMSCompliant: false } }
    );
    
    // 5. Insert new QMS-compliant domainTasks
    console.log(`\nInserting ${newDomainTasks.length} QMS-compliant domainTasks...`);
    const insertResult = await db.collection('domainTasks').insertMany(newDomainTasks);
    console.log(`Inserted ${insertResult.insertedCount} documents`);
    
    // 6. List created tasks
    console.log('\nCreated domainTasks:');
    for (const task of newDomainTasks) {
      console.log(`- ${task.title} (${task.taskType}) - Master: ${task.masterTaskId}`);
    }
    
    // 7. Update existing userTasks to reference new domainTasks
    console.log('\n=== UPDATING USER TASKS ===');
    
    // Get mapping of old domainTask masterTaskIds to new domainTask IDs
    const oldDomainTasks = await db.collection('domainTasks')
      .find({ isQMSCompliant: false })
      .toArray();
    
    for (const oldTask of oldDomainTasks) {
      if (!oldTask.masterTaskId) continue;
      
      // Find corresponding new task
      const newTaskId = insertResult.insertedIds[
        newDomainTasks.findIndex(t => t.masterTaskId === oldTask.masterTaskId)
      ];
      
      if (newTaskId) {
        console.log(`Updating userTasks: ${oldTask._id} → ${newTaskId}`);
        
        // Update userTasks to point to new domainTask
        const updateResult = await db.collection('userTasks').updateMany(
          { domainTaskId: oldTask._id.toString() },
          { 
            $set: { 
              domainTaskId: newTaskId.toString(),
              isQMSCompliant: false // Mark as needing update
            } 
          }
        );
        
        console.log(`  Updated ${updateResult.modifiedCount} userTasks`);
      }
    }
    
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log('\nNext steps:');
    console.log('1. Verify the new domainTasks in the application');
    console.log('2. Update userTask assignment logic to copy full domainTask data');
    console.log('3. Update TaskExecution to use UserTask snapshot only');
    console.log('4. Once verified, delete old non-compliant domainTasks');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

/**
 * Generate display configuration based on masterTask properties
 */
function getDisplayConfig(masterTask) {
  // Icon mapping based on category
  const iconMapping = {
    'identity': 'shield',
    'onboarding': 'users',
    'training': 'book',
    'operational': 'briefcase',
    'compliance': 'checklist',
    'financial': 'lightbulb'
  };
  
  // Color mapping based on category
  const colorMapping = {
    'identity': 'blue',
    'onboarding': 'green',
    'training': 'purple',
    'operational': 'orange',
    'compliance': 'gray',
    'financial': 'blue'
  };
  
  // CTA text based on execution model
  const ctaTextMapping = {
    'form': 'Fill Form',
    'sop': 'Start Process',
    'knowledge': 'Learn More',
    'bpmn': 'Start Workflow',
    'training': 'Start Training'
  };
  
  return {
    iconType: iconMapping[masterTask.category] || 'briefcase',
    colorScheme: colorMapping[masterTask.category] || 'blue',
    ctaText: ctaTextMapping[masterTask.executionModel] || 'Start',
    ctaAction: {
      type: 'process',
      target: masterTask.masterTaskId || masterTask.processId || masterTask._id.toString(),
      params: {}
    }
  };
}

// Run the migration
migrateToQMSCompliant();