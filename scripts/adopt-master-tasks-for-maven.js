const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function adoptMasterTasksForMaven() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const masterTasksCollection = db.collection('masterTasks');
    const domainTasksCollection = db.collection('domainTasks');
    const domainsCollection = db.collection('domains');

    // Get Maven Hub domain
    const mavenDomain = await domainsCollection.findOne({ name: 'Maven Hub' });
    if (!mavenDomain) {
      console.error('Maven Hub domain not found!');
      return;
    }
    console.log('Found Maven Hub domain:', mavenDomain._id);

    // Get all MasterTasks
    const masterTasks = await masterTasksCollection.find({}).toArray();
    console.log(`\nFound ${masterTasks.length} MasterTasks to adopt`);

    // Check for existing QMS-compliant domain tasks to avoid duplicates
    const existingDomainTasks = await domainTasksCollection.find({
      domain: mavenDomain._id.toString(),
      isQMSCompliant: true
    }).toArray();
    
    const existingMasterTaskIds = new Set(existingDomainTasks.map(dt => dt.masterTaskId));
    console.log(`Found ${existingDomainTasks.length} existing QMS-compliant domain tasks`);

    const domainTasksToInsert = [];

    for (const masterTask of masterTasks) {
      const masterTaskId = masterTask.masterTaskId || masterTask.processId || masterTask._id.toString();
      
      if (existingMasterTaskIds.has(masterTaskId)) {
        console.log(`\n⏭️  Skipping "${masterTask.name}" - already adopted`);
        continue;
      }

      console.log(`\n📋 Adopting: ${masterTask.name} (${masterTaskId})`);

      // Generate display configuration
      const iconMapping = {
        'compliance': 'shield',
        'identity': 'shield',
        'onboarding': 'users',
        'training': 'book',
        'operational': 'briefcase',
        'financial': 'lightbulb'
      };
      
      const colorMapping = {
        'compliance': 'blue',
        'identity': 'blue',
        'onboarding': 'green',
        'training': 'purple',
        'operational': 'orange',
        'financial': 'blue'
      };
      
      const ctaTextMapping = {
        'form': 'Fill Form',
        'sop': 'Start Process',
        'knowledge': 'Learn More',
        'bpmn': 'Start Workflow',
        'training': 'Start Training'
      };

      // Map task type
      const taskTypeMapping = {
        'identity': 'identity_verification',
        'compliance': 'compliance',
        'onboarding': 'onboarding',
        'training': 'training',
        'operational': 'task',
        'financial': 'task'
      };

      const taskType = taskTypeMapping[masterTask.category] || 'task';

      // Create QMS-compliant DomainTask with COMPLETE snapshot
      const domainTask = {
        // Domain-specific fields
        domain: mavenDomain._id.toString(),
        title: masterTask.name,
        description: masterTask.description,
        taskType: taskType,
        
        // References (for audit trail)
        masterTaskId: masterTaskId,
        masterTaskVersion: masterTask.standardOperatingProcedure?.metadata?.version || '1.0.0',
        originalMasterTaskId: masterTaskId,
        
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
          
          // Execution data - CRITICAL FOR QMS COMPLIANCE
          executionData: {
            executionModel: masterTask.executionModel,
            aiAgentAttached: masterTask.aiAgentAttached || false,
            aiAgentRole: masterTask.aiAgentRole,
            systemPrompt: masterTask.systemPrompt,
            intro: masterTask.intro,
            standardOperatingProcedure: masterTask.standardOperatingProcedure,
            requiredParameters: masterTask.requiredParameters || [],
            checklist: masterTask.checklist || [],
            sopMetadata: masterTask.sopMetadata || {}
          },
          
          // Full data copy
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
        
        // Domain customizations
        domainCustomizations: {},
        
        // Adoption metadata
        adoptedAt: new Date(),
        adoptedBy: 'system-admin',
        adoptionNotes: 'Batch adoption via script for Maven Hub',
        
        // Display configuration
        iconType: iconMapping[masterTask.category] || 'briefcase',
        colorScheme: colorMapping[masterTask.category] || 'blue',
        ctaText: ctaTextMapping[masterTask.executionModel] || 'Start',
        ctaAction: {
          type: 'process',
          target: masterTaskId,
          params: {}
        },
        
        // Task behavior
        requiresIdentityVerification: masterTask.name !== 'Capture ID Document',
        prerequisiteTasks: [],
        nextTasks: [],
        canHide: true,
        priority: masterTask.name === 'Capture ID Document' ? 'urgent' : 'normal',
        category: masterTask.name === 'Capture ID Document' ? 'required' : 'recommended',
        
        // Additional metadata
        estimatedTime: masterTask.sopMetadata?.estimatedDuration || '30 minutes',
        reward: null,
        version: '1.0.0',
        
        // Status flags
        isActive: true,
        isActiveInDomain: true,
        isQMSCompliant: true,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Special handling for identity verification
      if (masterTask.name === 'Capture ID Document') {
        domainTask.requiresIdentityVerification = false;
        domainTask.taskType = 'identity_verification';
      }

      domainTasksToInsert.push(domainTask);
    }

    if (domainTasksToInsert.length > 0) {
      // Insert all domain tasks
      const result = await domainTasksCollection.insertMany(domainTasksToInsert);
      console.log(`\n✅ Successfully adopted ${result.insertedCount} tasks for Maven Hub`);
      
      // Update MasterTasks with adoption info
      for (const domainTask of domainTasksToInsert) {
        await masterTasksCollection.updateOne(
          { $or: [
            { masterTaskId: domainTask.masterTaskId },
            { processId: domainTask.masterTaskId },
            { _id: new mongoose.Types.ObjectId(domainTask.masterTaskId) }
          ]},
          { 
            $push: {
              adoptedByDomains: {
                domainId: mavenDomain._id.toString(),
                adoptedAt: new Date(),
                allowedRoles: ['user', 'admin'],
                isActive: true
              }
            }
          }
        );
      }
      
      console.log('\n📊 Adoption Summary:');
      domainTasksToInsert.forEach(task => {
        console.log(`  ✓ ${task.title} (${task.taskType})`);
      });
    } else {
      console.log('\n✅ All tasks already adopted - no new adoptions needed');
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

adoptMasterTasksForMaven();