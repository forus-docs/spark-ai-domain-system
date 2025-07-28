import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';
import DomainTask from '@/app/models/DomainTask';

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
   * Adopt a MasterTask into a domain - simplified with unified schema
   */
  static async adoptMasterTask(request: DomainTaskAdoptionRequest): Promise<AdoptionResult> {
    await connectToDatabase();

    try {
      // Get the MasterTask (with empty domain per unified schema)
      const masterTask = await MasterTask.findOne({ 
        $and: [
          {
            $or: [
              { masterTaskId: request.masterTaskId },
              { _id: request.masterTaskId }
            ]
          },
          {
            $or: [
              { domain: { $exists: false } },
              { domain: "" },
              { domain: null }
            ]
          }
        ]
      });

      if (!masterTask) {
        return { success: false, error: 'Master task not found' };
      }

      // Check if already adopted in domainTasks collection
      const existingDomainTask = await DomainTask.findOne({
        domain: request.domainId,
        masterTaskId: masterTask.masterTaskId
      });

      if (existingDomainTask) {
        return { success: false, error: 'Task already adopted by this domain' };
      }

      // Create domain task - complete snapshot in domainTasks collection
      const domainTaskData = masterTask.toObject();
      delete domainTaskData._id;
      delete domainTaskData.adoptedByDomains; // Remove this field from master
      
      // Add domain-specific fields
      domainTaskData.masterTaskId = masterTask.masterTaskId; // Reference to original
      domainTaskData.domain = request.domainId;
      domainTaskData.adoptedAt = new Date();
      domainTaskData.adoptedBy = request.adoptedBy;
      domainTaskData.adoptionNotes = '';
      
      // Apply customizations
      if (request.customizations) {
        domainTaskData.domainCustomizations = request.customizations;
        if (request.customizations.title) domainTaskData.title = request.customizations.title;
        if (request.customizations.description) domainTaskData.description = request.customizations.description;
        if (request.customizations.estimatedTime) domainTaskData.estimatedTime = request.customizations.estimatedTime;
        if (request.customizations.priority) domainTaskData.priority = request.customizations.priority;
        if (request.customizations.reward) domainTaskData.reward = request.customizations.reward;
        if (request.customizations.systemPrompt) domainTaskData.systemPrompt = request.customizations.systemPrompt;
      }

      // Initialize domain metrics
      domainTaskData.domainMetrics = {
        totalExecutions: 0,
        averageCompletionTime: 0,
        averageSuccessRate: 0,
        lastExecuted: null
      };

      const domainTask = await DomainTask.create(domainTaskData);

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
   * Get available MasterTasks for adoption by a domain
   */
  static async getAvailableTasksForAdoption(domainId: string): Promise<any[]> {
    await connectToDatabase();

    try {
      // Get all active MasterTasks (no domain field or empty domain)
      const masterTasks = await MasterTask.find({ 
        isActive: true,
        $or: [
          { domain: { $exists: false } },
          { domain: "" },
          { domain: null }
        ]
      });

      // Get already adopted tasks from domainTasks collection
      const adoptedTasks = await DomainTask.find({ 
        domain: domainId
      }).select('masterTaskId');
      
      const adoptedMasterTaskIds = new Set(adoptedTasks.map(t => t.masterTaskId));

      // Filter and format available tasks - include adoption status
      return masterTasks.map(task => {
        const taskObj = task.toObject();
        return {
          ...taskObj,
          isAdoptedByDomain: adoptedMasterTaskIds.has(task.masterTaskId)
        };
      });

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
        domain: domainId
      });

      if (!domainTask) {
        return { success: false, error: 'Domain task not found' };
      }

      // Update customizations
      const updates: any = {
        domainCustomizations: {
          ...domainTask.domainCustomizations,
          ...customizations
        },
        updatedAt: new Date()
      };

      // Update top-level fields if customized
      if (customizations.title) updates.title = customizations.title;
      if (customizations.description) updates.description = customizations.description;
      if (customizations.estimatedTime) updates.estimatedTime = customizations.estimatedTime;
      if (customizations.priority) updates.priority = customizations.priority;
      if (customizations.reward) updates.reward = customizations.reward;
      if (customizations.systemPrompt) updates.systemPrompt = customizations.systemPrompt;

      const updatedTask = await MasterTask.findByIdAndUpdate(
        domainTaskId,
        updates,
        { new: true }
      );

      return {
        success: true,
        domainTask: {
          id: updatedTask._id.toString(),
          title: updatedTask.title,
          description: updatedTask.description,
          domainCustomizations: updatedTask.domainCustomizations
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