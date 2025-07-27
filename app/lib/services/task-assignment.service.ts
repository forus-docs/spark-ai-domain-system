import MasterTask from '@/app/models/MasterTask';
import { TaskAssignmentRequest } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class TaskAssignmentService {
  /**
   * Assign a task to a user - simplified with unified schema
   */
  static async assignTask(request: TaskAssignmentRequest): Promise<{ success: boolean; error?: string; userTask?: any; userTaskId?: string }> {
    await connectToDatabase();

    try {
      // Find the domain task (MasterTask with domain field)
      const domainTask = await MasterTask.findById(request.taskId);
      
      if (!domainTask || !domainTask.domain) {
        return { success: false, error: 'Domain task not found' };
      }
      
      if (!domainTask.active) {
        return { success: false, error: 'Task is not active' };
      }

      // Check if already assigned to this user
      const existing = await MasterTask.findOne({
        userId: request.userId,
        domainTaskId: request.taskId
      });

      if (existing) {
        // If it was hidden, unhide it
        if (existing.isHidden && existing.canHide) {
          existing.isHidden = false;
          await existing.save();
          return { success: true, userTask: existing, userTaskId: existing._id.toString() };
        }
        return { success: false, error: 'Task already assigned' };
      }

      // Check prerequisites if any
      if (domainTask.prerequisiteTasks && domainTask.prerequisiteTasks.length > 0) {
        const completedPrereqs = await MasterTask.countDocuments({
          userId: request.userId,
          domainTaskId: { $in: domainTask.prerequisiteTasks },
          isCompleted: true
        });

        if (completedPrereqs < domainTask.prerequisiteTasks.length) {
          return { success: false, error: 'Prerequisites not met' };
        }
      }

      // Create user task - simple copy with user fields
      const userTaskData = domainTask.toObject();
      delete userTaskData._id; // Remove _id so MongoDB creates a new one
      
      // Add user-specific fields
      userTaskData.userId = request.userId;
      userTaskData.domainTaskId = request.taskId;
      userTaskData.assignedTo = request.userId;
      userTaskData.assignedBy = request.assignedBy || request.userId;
      userTaskData.assignmentReason = request.reason || 'user_initiated';
      userTaskData.timestampAssigned = new Date();
      
      // Initialize progress tracking
      userTaskData.isCompleted = false;
      userTaskData.isHidden = false;
      userTaskData.viewCount = 0;
      userTaskData.progress = {
        currentStep: 0,
        totalSteps: 1,
        percentComplete: 0
      };

      // Create the user task
      const userTask = await MasterTask.create(userTaskData);

      return { success: true, userTask, userTaskId: userTask._id.toString() };
    } catch (error) {
      console.error('Error assigning task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to assign task' 
      };
    }
  }
}