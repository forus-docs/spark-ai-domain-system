import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';

export interface DomainTaskAdoptionRequest {
  domainId: string;
  masterTaskId: string;
  adoptedBy: string;
  customizations?: {
    title?: string;
    description?: string;
    estimatedTime?: string;
    systemPrompt?: string;
    additionalContext?: string;
    priority?: string;
    reward?: {
      amount: number;
      currency: string;
      displayText: string;
    };
  };
}

export interface AdoptionResult {
  success: boolean;
  domainTask?: any;
  error?: string;
}

export class DomainAdoptionService {
  /**
   * QMS-COMPLIANT: Adopt a MasterTask into a domain with complete data snapshot
   * This creates an immutable copy of all MasterTask data at the time of adoption
   */
  static async adoptMasterTask(request: DomainTaskAdoptionRequest): Promise<AdoptionResult> {
    await connectToDatabase();

    try {
      // Get the MasterTask
      const masterTask = await MasterTask.findOne({ 
        $or: [
          { masterTaskId: request.masterTaskId },
          { _id: request.masterTaskId }
        ]
      });

      if (!masterTask) {
        return { success: false, error: 'Master task not found' };
      }

      // Check if already adopted
      const existingDomainTask = await DomainTask.findOne({
        domain: request.domainId,
        masterTaskId: masterTask._id.toString(),
        isQMSCompliant: true
      });

      if (existingDomainTask) {
        return { success: false, error: 'Task already adopted by this domain' };
      }

      // Create QMS-compliant DomainTask
      const domainTask = await this.createQMSCompliantDomainTask(
        masterTask,
        request.domainId,
        request.adoptedBy,
        request.customizations
      );

      // Update MasterTask adoption tracking
      await this.updateMasterTaskAdoption(
        masterTask._id,
        request.domainId,
        request.customizations
      );

      return {
        success: true,
        domainTask: {
          id: domainTask._id.toString(),
          title: domainTask.title,
          description: domainTask.description,
          taskType: domainTask.taskType,
          masterTaskId: domainTask.masterTaskId,
          isQMSCompliant: domainTask.isQMSCompliant
        }
      };

    } catch (error) {
      console.error('Error in adoptMasterTask:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to adopt task' 
      };
    }
  }

  /**
   * Create a QMS-compliant DomainTask with complete MasterTask snapshot
   */
  private static async createQMSCompliantDomainTask(
    masterTask: any,
    domainId: string,
    adoptedBy: string,
    customizations?: any
  ) {
    // Map task type
    const taskTypeMapping: Record<string, string> = {
      'identity': 'identity_verification',
      'onboarding': 'onboarding',
      'training': 'training',
      'operational': 'task',
      'compliance': 'compliance',
      'financial': 'task'
    };

    const taskType = taskTypeMapping[masterTask.category] || 'task';

    // Generate display configuration
    const displayConfig = this.generateDisplayConfig(masterTask);

    // Create domain task with complete snapshot
    const domainTask = new DomainTask({
      // Domain-specific fields
      domain: domainId,
      title: customizations?.title || masterTask.name,
      description: customizations?.description || masterTask.description,
      taskType: taskType,
      
      // References (for audit trail)
      masterTaskId: masterTask._id.toString(),
      masterTaskVersion: masterTask.standardOperatingProcedure?.metadata?.version || '1.0.0',
      originalMasterTaskId: masterTask._id.toString(),
      
      // Complete MasterTask snapshot (QMS Compliant)
      masterTaskSnapshot: {
        name: masterTask.name,
        category: masterTask.category,
        executionModel: masterTask.executionModel,
        
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
      
      // Domain customizations
      domainCustomizations: customizations || {},
      
      // Adoption metadata
      adoptedAt: new Date(),
      adoptedBy: adoptedBy,
      adoptionNotes: `QMS-compliant adoption with complete data snapshot`,
      
      // Display configuration
      ...displayConfig,
      
      // Task behavior
      requiresIdentityVerification: masterTask.category !== 'identity',
      prerequisiteTasks: [],
      nextTasks: [],
      canHide: true,
      priority: customizations?.priority || 'normal',
      category: masterTask.category === 'identity' ? 'required' : 'recommended',
      
      // Additional metadata
      estimatedTime: customizations?.estimatedTime || masterTask.sopMetadata?.estimatedDuration || '30 minutes',
      reward: customizations?.reward,
      version: '1.0.0',
      
      // Status flags
      isActive: true,
      isActiveInDomain: true,
      isQMSCompliant: true
    });

    // Special handling for identity verification
    if (masterTask.category === 'identity') {
      domainTask.ctaAction.type = 'process';
      domainTask.priority = 'urgent';
      domainTask.category = 'required';
      domainTask.requiresIdentityVerification = false;
    }

    await domainTask.save();
    return domainTask;
  }

  /**
   * Update MasterTask with adoption tracking
   */
  private static async updateMasterTaskAdoption(
    masterTaskId: string,
    domainId: string,
    customizations?: any
  ) {
    await MasterTask.findByIdAndUpdate(masterTaskId, {
      $push: {
        adoptedByDomains: {
          domainId: domainId,
          adoptedAt: new Date(),
          allowedRoles: ['user', 'admin'],
          customName: customizations?.title,
          customDescription: customizations?.description,
          isActive: true
        }
      }
    });
  }

  /**
   * Generate display configuration based on MasterTask properties
   */
  private static generateDisplayConfig(masterTask: any) {
    const iconMapping: Record<string, string> = {
      'identity': 'shield',
      'onboarding': 'users',
      'training': 'book',
      'operational': 'briefcase',
      'compliance': 'checklist',
      'financial': 'lightbulb'
    };
    
    const colorMapping: Record<string, string> = {
      'identity': 'blue',
      'onboarding': 'green',
      'training': 'purple',
      'operational': 'orange',
      'compliance': 'gray',
      'financial': 'blue'
    };
    
    const ctaTextMapping: Record<string, string> = {
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
        target: masterTask._id.toString(),
        params: {}
      }
    };
  }

  /**
   * Get available MasterTasks for adoption by a domain
   */
  static async getAvailableTasksForAdoption(domainId: string): Promise<any[]> {
    await connectToDatabase();

    try {
      // Get all active MasterTasks
      const masterTasks = await MasterTask.find({ active: true });

      // Get already adopted tasks
      const adoptedTasks = await DomainTask.find({ 
        domain: domainId,
        isQMSCompliant: true 
      }).select('masterTaskId');
      
      const adoptedMasterTaskIds = new Set(adoptedTasks.map(t => t.masterTaskId));

      // Filter and format available tasks
      return masterTasks
        .filter(task => {
          const taskId = task._id.toString();
          return !adoptedMasterTaskIds.has(taskId);
        })
        .map(task => ({
          id: task._id.toString(),
          name: task.name,
          description: task.description,
          category: task.category,
          executionModel: task.executionModel,
          aiAgentAttached: task.aiAgentAttached,
          estimatedDuration: task.sopMetadata?.estimatedDuration,
          complianceStandards: task.sopMetadata?.complianceStandards,
          adoptedByCount: task.adoptedByDomains?.length || 0
        }));

    } catch (error) {
      console.error('Error getting available tasks:', error);
      return [];
    }
  }

  /**
   * Update domain task with new customizations
   */
  static async updateDomainTaskCustomizations(
    domainTaskId: string,
    domainId: string,
    customizations: any
  ): Promise<AdoptionResult> {
    await connectToDatabase();

    try {
      const domainTask = await DomainTask.findOne({
        _id: domainTaskId,
        domain: domainId,
        isQMSCompliant: true
      });

      if (!domainTask) {
        return { success: false, error: 'Domain task not found' };
      }

      // Update customizations
      domainTask.domainCustomizations = {
        ...domainTask.domainCustomizations,
        ...customizations
      };

      // Update top-level fields if customized
      if (customizations.title) {
        domainTask.title = customizations.title;
      }
      if (customizations.description) {
        domainTask.description = customizations.description;
      }
      if (customizations.estimatedTime) {
        domainTask.estimatedTime = customizations.estimatedTime;
      }
      if (customizations.priority) {
        domainTask.priority = customizations.priority;
      }
      if (customizations.reward) {
        domainTask.reward = customizations.reward;
      }

      domainTask.updatedAt = new Date();
      await domainTask.save();

      return {
        success: true,
        domainTask: {
          id: domainTask._id.toString(),
          title: domainTask.title,
          description: domainTask.description,
          domainCustomizations: domainTask.domainCustomizations
        }
      };

    } catch (error) {
      console.error('Error updating domain task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update domain task' 
      };
    }
  }
}