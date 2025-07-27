import DomainTask from '@/app/models/DomainTask';
import UserTask from '@/app/models/UserTask';
import User from '@/app/models/User';
import { TaskFilterOptions, UserTaskDisplay } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class TaskDisplayService {
  /**
   * Get tasks for user's home screen
   */
  static async getUserTasks(userId: string, options: TaskFilterOptions = {}): Promise<UserTaskDisplay[]> {
    console.log('TaskDisplayService.getUserTasks called with:', { userId, options });
    
    await connectToDatabase();

    try {
      // CRITICAL DEBUG: Let's see what's in the database
      const sampleUserTask = await UserTask.findOne({});
      console.log('DEBUG - Sample UserTask from DB:', {
        _id: sampleUserTask?._id,
        userId: sampleUserTask?.userId,
        userIdType: typeof sampleUserTask?.userId,
      });
      
      console.log('DEBUG - Query userId:', {
        value: userId,
        type: typeof userId,
        length: userId.length
      });
      
      // Build query
      const query: any = { userId };
      
      if (!options.includeCompleted) {
        query.isCompleted = false;
      }
      
      if (!options.includeHidden) {
        query.isHidden = false;
      }

      console.log('UserTask query:', JSON.stringify(query));

      // Get user tasks
      const userTasks = await UserTask.find(query)
        .sort({ timestampAssigned: -1 })
        .limit(options.limit || 50);
        
      console.log('UserTasks found:', userTasks.length);

      // We still need to check if domain tasks are active and get domain info
      const taskIds = userTasks.map(ut => ut.domainTaskId);
      const domainTasks = await DomainTask.find({ _id: { $in: taskIds } }, { isActive: 1, domain: 1 });
      const domainTaskMap = new Map(domainTasks.map(t => [t._id.toString(), t]));
      

      // Get user for identity verification check
      const user = await User.findById(userId);
      const isIdentityVerified = user?.identity?.isVerified || false;

      // Build display objects
      const displayTasks: UserTaskDisplay[] = [];
      
      for (const userTask of userTasks) {
        const domainTask = domainTaskMap.get(userTask.domainTaskId);
        
        // Skip if domain task is no longer active
        if (!domainTask || !domainTask.isActive) continue;

        // Apply domain filter if specified (using domain task domain)
        if (options.domain && domainTask.domain !== options.domain && domainTask.domain !== 'all') {
          continue;
        }

        // Use snapshot data for display, but check identity verification against user's current status
        const snapshot = userTask.taskSnapshot;
        const ctaEnabled = !snapshot.requiresIdentityVerification || isIdentityVerified;
        
        // Convert to plain object to avoid Mongoose document issues
        const userTaskObj = userTask.toObject();
        const snapshotObj = userTaskObj.taskSnapshot;
        
        const domainTaskData = {
          // Use snapshot data for all display fields
          id: userTask.domainTaskId, // Keep reference to original task ID
          domain: domainTask.domain, // Use current domain from domain task
          ...snapshotObj, // All other fields from snapshot
        };
        
        const displayTask = {
          ...userTaskObj,
          id: userTask._id.toString(),
          domainTask: domainTaskData,
          isNew: (Date.now() - userTask.timestampAssigned.getTime()) < 24 * 60 * 60 * 1000,
          isUrgent: snapshotObj.priority === 'urgent',
          canInteract: ctaEnabled,
          ctaEnabled,
          ctaTooltip: !ctaEnabled ? 'Complete identity verification to access this feature' : undefined
        };
        
        displayTasks.push(displayTask);
      }

      // Sort by priority and date
      displayTasks.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const aPriority = priorityOrder[a.domainTask.priority];
        const bPriority = priorityOrder[b.domainTask.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return b.timestampAssigned.getTime() - a.timestampAssigned.getTime();
      });

      return displayTasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return [];
    }
  }
}