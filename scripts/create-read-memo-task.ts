import mongoose from 'mongoose';
import MasterTask from '../app/models/MasterTask';
import { v4 as uuidv4 } from 'uuid';

async function createReadMemoTask() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/spark-ai');
    console.log('Connected to MongoDB');

    const readMemoTask = {
      // Core identification
      masterTaskId: uuidv4(),
      name: 'Read and Acknowledge Memo',
      description: 'Read, understand, and formally acknowledge receipt of important organizational memos or policy updates. This task ensures QMS compliance by tracking that all relevant personnel have received and acknowledged critical communications.',
      category: 'compliance',
      
      // Execution configuration - manual since no AI assistance
      executionModel: 'form',
      currentStage: 'manual',
      
      // Display configuration
      title: 'Read and Acknowledge Memo',
      iconType: 'megaphone',
      colorScheme: 'orange',
      ctaText: 'Read Memo',
      ctaAction: {
        type: 'acknowledgment',
        target: 'memo-viewer',
        params: {}
      },
      imageUrl: '',
      
      // Task metadata
      taskType: 'acknowledgment',
      priority: 'high',
      estimatedTime: '5-10 minutes',
      reward: null, // No reward for compliance tasks
      version: '1.0.0',
      
      // Task flow
      prerequisiteTasks: [],
      nextTasks: [],
      requiresIdentityVerification: true, // Must verify who acknowledged
      canHide: false, // Cannot hide compliance tasks
      
      // QMS compliance
      isQMSCompliant: true,
      
      // Form schema for acknowledgment
      formSchema: {
        type: 'object',
        required: ['memoId', 'userAcknowledgment', 'comprehensionConfirmation'],
        properties: {
          memoId: {
            type: 'string',
            title: 'Memo Reference',
            description: 'Unique identifier of the memo being acknowledged'
          },
          memoTitle: {
            type: 'string',
            title: 'Memo Title',
            readOnly: true
          },
          memoDate: {
            type: 'string',
            format: 'date',
            title: 'Memo Date',
            readOnly: true
          },
          memoContent: {
            type: 'string',
            title: 'Memo Content',
            format: 'textarea',
            readOnly: true
          },
          userAcknowledgment: {
            type: 'boolean',
            title: 'I acknowledge that I have read and understood this memo',
            default: false
          },
          comprehensionConfirmation: {
            type: 'string',
            title: 'Please summarize your understanding of the key points',
            format: 'textarea',
            minLength: 50,
            description: 'Briefly describe the main points of the memo to confirm understanding'
          },
          questionsOrConcerns: {
            type: 'string',
            title: 'Questions or Concerns (Optional)',
            format: 'textarea',
            description: 'Any questions or concerns about the memo content'
          },
          acknowledgmentTimestamp: {
            type: 'string',
            format: 'date-time',
            title: 'Acknowledged At',
            readOnly: true
          }
        }
      },
      
      // Validation rules
      validationRules: {
        userAcknowledgment: {
          mustBeTrue: 'You must acknowledge reading and understanding the memo'
        },
        comprehensionConfirmation: {
          minLength: 50,
          required: true,
          message: 'Please provide a summary of at least 50 characters to confirm understanding'
        }
      },
      
      // SOP metadata for compliance tracking
      sopMetadata: {
        complianceStandards: ['ISO 9001', 'Document Control', 'Communication Management'],
        auditTrailRequired: true,
        regulatoryBody: 'Internal QMS',
        riskLevel: 'medium',
        mandatorySteps: 3,
        estimatedDuration: '5-10 minutes',
        requiredApprovals: [],
        auditRequirements: [
          'All memo acknowledgments must be logged with timestamp',
          'User identity must be verified before acknowledgment',
          'Comprehension confirmation must be stored',
          'Unacknowledged memos must be tracked and reported',
          'Acknowledgment reports must be available for audit'
        ]
      },
      
      // Checklist for structured execution
      checklist: [
        {
          step: 1,
          order: 1,
          title: 'Access Memo',
          description: 'Open and view the memo content',
          type: 'action',
          required: true,
          completed: false,
          subSteps: []
        },
        {
          step: 2,
          order: 2,
          title: 'Read and Understand',
          description: 'Carefully read the entire memo and understand its implications',
          type: 'reading',
          required: true,
          completed: false,
          subSteps: [
            {
              step: '2.1',
              order: 1,
              field: 'readingTime',
              title: 'Track Reading Time',
              description: 'System tracks time spent reading the memo',
              required: true
            }
          ]
        },
        {
          step: 3,
          order: 3,
          title: 'Acknowledge Receipt',
          description: 'Formally acknowledge that you have read and understood the memo',
          type: 'confirmation',
          required: true,
          completed: false,
          subSteps: [
            {
              step: '3.1',
              order: 1,
              field: 'userAcknowledgment',
              title: 'Check Acknowledgment Box',
              description: 'Confirm you have read and understood',
              required: true
            },
            {
              step: '3.2',
              order: 2,
              field: 'comprehensionConfirmation',
              title: 'Summarize Understanding',
              description: 'Provide a brief summary of key points',
              required: true
            }
          ]
        }
      ],
      
      // System prompt (not used for manual tasks but included for completeness)
      systemPrompt: '',
      intro: 'This task requires you to read and formally acknowledge an important organizational memo. Your acknowledgment will be recorded for QMS compliance purposes.',
      
      // Required parameters
      requiredParameters: [
        {
          name: 'memoId',
          displayName: 'Memo ID',
          type: 'string',
          description: 'The unique identifier of the memo to be acknowledged',
          validation: {
            required: true,
            pattern: '',
            minLength: 1,
            maxLength: 100
          },
          examples: ['MEMO-2025-001', 'POL-UPDATE-123']
        },
        {
          name: 'userId',
          displayName: 'User ID',
          type: 'string',
          description: 'The ID of the user acknowledging the memo',
          validation: {
            required: true,
            pattern: '',
            minLength: 1,
            maxLength: 100
          },
          examples: []
        }
      ],
      
      // Domain-specific fields (empty for master task)
      domain: '',
      domainCustomizations: null,
      adoptedAt: null,
      adoptedBy: '',
      adoptionNotes: '',
      
      // User assignment fields (empty for master task)
      userId: '',
      domainTaskId: '',
      assignedTo: '',
      assignedBy: '',
      assignmentReason: '',
      timestampAssigned: null,
      
      // User progress fields
      isCompleted: false,
      isHidden: false,
      viewCount: 0,
      progress: {
        currentStep: 0,
        totalSteps: 3,
        percentComplete: 0
      },
      completedAt: null,
      completionData: null,
      params: null,
      
      // Standard Operating Procedure (null for form-based task)
      standardOperatingProcedure: null,
      
      // Other execution models (null for this task)
      workflowDefinition: null,
      curriculum: [],
      
      // Global metrics
      globalMetrics: {
        totalExecutions: 0,
        averageCompletionTime: 0,
        averageSuccessRate: 0
      },
      
      // AI fields (not applicable for manual task)
      aiAgentAttached: false,
      aiAgentRole: '',
      aiAgentId: '',
      promotionArtifact: '',
      promotionDate: null,
      aiCurrentFocus: '',
      
      // Context documents (can be populated with memo content)
      contextDocuments: [],
      
      // Domain adoption tracking
      adoptedByDomains: [],
      
      // Status
      active: true,
      isActive: true
    };

    // Check if task already exists
    const existingTask = await MasterTask.findOne({ name: 'Read and Acknowledge Memo' });
    if (existingTask) {
      console.log('Read Memo task already exists:', existingTask._id);
      return;
    }

    // Create the task
    const newTask = new MasterTask(readMemoTask);
    await newTask.save();
    
    console.log('Successfully created Read Memo MasterTask:', newTask._id);
    console.log('Task details:', {
      id: newTask.masterTaskId,
      name: newTask.name,
      executionModel: newTask.executionModel,
      currentStage: newTask.currentStage,
      isQMSCompliant: newTask.isQMSCompliant
    });

  } catch (error) {
    console.error('Error creating Read Memo task:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createReadMemoTask();