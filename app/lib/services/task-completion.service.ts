import TaskExecution from '@/app/models/TaskExecution';
import { TaskCompletionRequest } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class TaskCompletionService {
  /**
   * Complete a task execution
   * TODO: Implement with new TaskExecution model
   */
  static async completeTask(request: TaskCompletionRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      // Find task execution by ID
      const taskExecution = await TaskExecution.findOne({
        executionId: request.userTaskId, // Using executionId instead
        userId: request.userId
      });

      if (!taskExecution) {
        return { success: false, error: 'Task execution not found' };
      }

      if (taskExecution.status === 'completed') {
        return { success: false, error: 'Task already completed' };
      }

      // Update status
      taskExecution.status = 'completed';
      taskExecution.completedAt = new Date();
      
      // Store completion data if provided
      if (request.completionData) {
        taskExecution.metadata = {
          ...taskExecution.metadata,
          completionData: request.completionData
        };
      }

      await taskExecution.save();

      return { success: true };
    } catch (error) {
      console.error('Error completing task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete task' 
      };
    }
  }
}