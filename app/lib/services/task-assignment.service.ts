import DomainTask from '@/app/models/DomainTask';
import UserTask from '@/app/models/UserTask';
import { TaskAssignmentRequest } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';
import mongoose from 'mongoose';

export class TaskAssignmentService {
  /**
   * Assign a task to a user with QMS-compliant snapshot
   */
  static async assignTask(request: TaskAssignmentRequest): Promise<{ success: boolean; error?: string; userTask?: any; userTaskId?: string }> {
    await connectToDatabase();
    
    let domainTask: any;

    try {
      // Check if task exists
      domainTask = await DomainTask.findById(request.taskId);
      if (!domainTask || !domainTask.isActive) {
        return { success: false, error: 'Task not found or inactive' };
      }

      // Check if already assigned
      const existing = await UserTask.findOne({
        userId: request.userId,
        domainTaskId: request.taskId
      });

      if (existing) {
        // If it was hidden, we can unhide it
        if (existing.isHidden && domainTask.canHide) {
          existing.isHidden = false;
          existing.hiddenAt = undefined;
          await existing.save();
          return { success: true, userTask: existing, userTaskId: existing._id.toString() };
        }
        return { success: false, error: 'Task already assigned' };
      }

      // Check prerequisites
      if (domainTask.prerequisiteTasks && domainTask.prerequisiteTasks.length > 0) {
        const completedPrereqs = await UserTask.countDocuments({
          userId: request.userId,
          domainTaskId: { $in: domainTask.prerequisiteTasks },
          isCompleted: true
        });

        if (completedPrereqs < domainTask.prerequisiteTasks.length) {
          return { success: false, error: 'Prerequisites not met' };
        }
      }

      // Create UserTask with proper structure
      // Convert domainTask to plain object to avoid Mongoose subdocument issues
      const domainTaskObj = domainTask.toObject();
      
      let userTask;
      try {
        const taskData = {
          userId: request.userId,
          domainTaskId: request.taskId,
          masterTaskId: domainTaskObj.masterTaskId || domainTaskObj._id,
          assignedTo: request.userId,
          assignedBy: request.assignedBy || request.userId,
          assignmentReason: request.reason || 'user_initiated',
          isQMSCompliant: true,
          taskSnapshot: {
            // Required fields from schema
            title: domainTaskObj.title || 'Untitled Task',
            description: domainTaskObj.description || 'No description',
            version: domainTaskObj.version || '1.0',
            ctaText: domainTaskObj.ctaText || 'Start',
            ctaAction: domainTaskObj.ctaAction ? {
              type: domainTaskObj.ctaAction.type || 'process',
              target: domainTaskObj.ctaAction.target || 'default',
              params: domainTaskObj.ctaAction.params || {}
            } : {
              type: 'process',
              target: 'default',
              params: {}
            },
            taskType: domainTaskObj.taskType || 'task',
            // All other fields - use undefined instead of null for optional fields
            imageUrl: domainTaskObj.imageUrl || undefined,
            iconType: domainTaskObj.iconType || undefined,
            colorScheme: domainTaskObj.colorScheme || undefined,
            requiresIdentityVerification: domainTaskObj.requiresIdentityVerification || undefined,
            canHide: domainTaskObj.canHide,
            priority: domainTaskObj.priority || undefined,
            category: domainTaskObj.category || undefined,
            estimatedTime: domainTaskObj.estimatedTime || undefined,
            reward: domainTaskObj.reward || undefined,
            prerequisiteTasks: domainTaskObj.prerequisiteTasks || undefined,
            nextTasks: domainTaskObj.nextTasks || undefined,
            // Only include executionData if it has the required executionModel field
            executionData: (domainTaskObj.masterTaskSnapshot?.executionData && 
                           domainTaskObj.masterTaskSnapshot.executionData.executionModel) 
                           ? domainTaskObj.masterTaskSnapshot.executionData 
                           : undefined,
            domainCustomizations: domainTaskObj.domainCustomizations || undefined
          }
        };
        
        console.log('Creating UserTask...');
        userTask = await UserTask.create(taskData);
      } catch (mongooseError) {
        console.error('Mongoose error creating UserTask:', mongooseError);
        console.error('Error name:', (mongooseError as any).name);
        console.error('Error message:', (mongooseError as any).message);
        if ((mongooseError as any).errors) {
          Object.keys((mongooseError as any).errors).forEach(key => {
            console.error(`Field ${key}:`, (mongooseError as any).errors[key].message);
          });
        }
        throw mongooseError;
      }

      return { success: true, userTask, userTaskId: userTask._id.toString() };
    } catch (error) {
      console.error('Error assigning task:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: request.userId,
        postId: request.taskId,
        domainTaskId: domainTask?._id
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign task' };
    }
  }
}