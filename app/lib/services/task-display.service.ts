import MasterTask from '@/app/models/MasterTask';
import User from '@/app/models/User';
import { TaskFilterOptions, UserTaskDisplay } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class TaskDisplayService {
  /**
   * Get tasks for user's home screen - simplified with unified schema
   */
  static async getUserTasks(userId: string, options: TaskFilterOptions = {}): Promise<UserTaskDisplay[]> {
    await connectToDatabase();

    try {
      // Build query for user tasks
      const query: any = { 
        userId,
        domain: { $exists: true } // Ensure it has domain (user task from domain task)
      };
      
      if (!options.includeCompleted) {
        query.isCompleted = false;
      }
      
      if (!options.includeHidden) {
        query.isHidden = false;
      }

      if (options.domain) {
        query.domain = options.domain;
      }

      // Get user tasks
      const userTasks = await MasterTask.find(query)
        .sort({ timestampAssigned: -1 })
        .limit(options.limit || 50);

      // Get user for identity verification check
      const user = await User.findById(userId);
      const isIdentityVerified = user?.identity?.isVerified || false;

      // Build display objects
      const displayTasks: UserTaskDisplay[] = userTasks.map(task => {
        const taskObj = task.toObject();
        const ctaEnabled = !task.requiresIdentityVerification || isIdentityVerified;
        
        return {
          ...taskObj,
          id: task._id.toString(),
          domainTask: {
            id: task.domainTaskId || task._id.toString(),
            domain: task.domain,
            ...taskObj // All fields are already on the task
          },
          isNew: (Date.now() - task.timestampAssigned.getTime()) < 24 * 60 * 60 * 1000,
          isUrgent: task.priority === 'urgent',
          canInteract: ctaEnabled,
          ctaEnabled,
          ctaTooltip: !ctaEnabled ? 'Complete identity verification to access this feature' : undefined
        };
      });

      // Sort by priority and date
      displayTasks.sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { urgent: 0, high: 1, normal: 2, low: 3 };
        const aPriority = priorityOrder[(a as any).priority || 'normal'];
        const bPriority = priorityOrder[(b as any).priority || 'normal'];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return (b as any).timestampAssigned.getTime() - (a as any).timestampAssigned.getTime();
      });

      return displayTasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return [];
    }
  }
}