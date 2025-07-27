import DomainTask from '@/app/models/DomainTask';
import UserTask from '@/app/models/UserTask';
import { connectToDatabase } from '@/app/lib/database';

export class TaskInteractionService {
  /**
   * Initialize tasks for a new user
   * UPDATE: No automatic task assignment - all tasks are user-initiated
   */
  static async initializeUserTasks(userId: string): Promise<void> {
    await connectToDatabase();

    // No automatic task assignments
    // Users will see all tasks as unassigned and can choose what to engage with
    console.log(`User ${userId} initialized - no tasks auto-assigned`);
  }

  /**
   * Toggle task visibility
   */
  static async toggleTaskVisibility(userId: string, userTaskId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userTask = await UserTask.findOne({
        _id: userTaskId,
        userId
      });

      if (!userTask) {
        return { success: false, error: 'User task not found' };
      }

      // Check if task can be hidden
      const domainTask = await DomainTask.findById(userTask.domainTaskId);
      if (!domainTask?.canHide) {
        return { success: false, error: 'This task cannot be hidden' };
      }

      userTask.isHidden = !userTask.isHidden;
      userTask.hiddenAt = userTask.isHidden ? new Date() : undefined;
      await userTask.save();

      return { success: true };
    } catch (error) {
      console.error('Error toggling task visibility:', error);
      return { success: false, error: 'Failed to toggle visibility' };
    }
  }

  /**
   * Mark task as viewed
   */
  static async markTaskViewed(userId: string, userTaskId: string): Promise<void> {
    await connectToDatabase();

    try {
      await UserTask.findOneAndUpdate(
        { _id: userTaskId, userId },
        {
          $set: { lastViewedAt: new Date() },
          $inc: { viewCount: 1 }
        }
      );
    } catch (error) {
      console.error('Error marking task as viewed:', error);
    }
  }

  /**
   * Assign domain-specific onboarding tasks
   * UPDATE: Now all domains use user-initiated assignment - no automatic assignment
   */
  static async assignDomainOnboardingTasks(userId: string, domainId: string): Promise<void> {
    await connectToDatabase();

    try {
      // All domains now use user-initiated assignment
      // No automatic task assignment when joining a domain
      console.log(`User joined domain ${domainId} - tasks will be user-initiated`);
      
      // We could still assign special system tasks here if needed in the future
      // For example: welcome messages, tutorials, etc.
      
    } catch (error) {
      console.error('Error in assignDomainOnboardingTasks:', error);
    }
  }
}