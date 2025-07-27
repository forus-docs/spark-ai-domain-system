import TaskExecution from '@/app/models/TaskExecution';
import { connectToDatabase } from '@/app/lib/database';

export class TaskInteractionService {
  /**
   * Initialize tasks for a new user
   * UPDATE: No automatic task assignment - all tasks are user-initiated
   */
  static async initializeUserTasks(userId: string): Promise<void> {
    // No-op: Users manually assign tasks to themselves
    await connectToDatabase();
    console.log('User tasks initialization - no automatic assignment for user:', userId);
  }

  /**
   * Toggle task execution visibility
   * TODO: Implement if needed with new model
   */
  static async toggleTaskVisibility(taskExecutionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    try {
      const taskExecution = await TaskExecution.findOne({
        executionId: taskExecutionId,
        userId
      });

      if (!taskExecution) {
        return { success: false, error: 'Task execution not found' };
      }

      // Toggle hidden state in metadata
      if (!taskExecution.metadata) {
        taskExecution.metadata = {};
      }
      taskExecution.metadata.isHidden = !taskExecution.metadata.isHidden;
      
      await taskExecution.save();
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling task visibility:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle visibility' 
      };
    }
  }

  /**
   * Track task execution view
   */
  static async trackTaskView(taskExecutionId: string, userId: string): Promise<void> {
    await connectToDatabase();
    
    try {
      const taskExecution = await TaskExecution.findOne({
        executionId: taskExecutionId,
        userId
      });

      if (taskExecution) {
        // Track view in metadata
        if (!taskExecution.metadata) {
          taskExecution.metadata = {};
        }
        taskExecution.metadata.lastViewedAt = new Date();
        taskExecution.metadata.viewCount = (taskExecution.metadata.viewCount || 0) + 1;
        
        await taskExecution.save();
      }
    } catch (error) {
      console.error('Error tracking task view:', error);
    }
  }

  /**
   * Assign domain-specific onboarding tasks
   * UPDATE: Now all domains use user-initiated assignment - no automatic assignment
   */
  static async assignDomainOnboardingTasks(userId: string, domainId: string): Promise<void> {
    await connectToDatabase();
    // No automatic task assignment when joining a domain
    console.log(`User joined domain ${domainId} - tasks will be user-initiated`);
  }
}