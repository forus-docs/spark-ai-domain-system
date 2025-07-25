import Post from '@/app/models/DomainTask';
import UserPost from '@/app/models/UserTask';
import User from '@/app/models/User';
import { 
  TaskAssignmentRequest, 
  TaskCompletionRequest, 
  TaskFilterOptions,
  UserTaskDisplay,
  IDENTITY_VERIFICATION_TASK
} from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class TaskJourneyService {
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
   * Assign a task to a user
   */
  static async assignTask(request: TaskAssignmentRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    let domainTask: any;

    try {
      // Check if task exists
      domainTask = await Post.findById(request.taskId);
      if (!domainTask || !domainTask.isActive) {
        return { success: false, error: 'Task not found or inactive' };
      }

      // Check if already assigned
      const existing = await UserPost.findOne({
        userId: request.userId,
        domainTaskId: request.taskId
      });

      if (existing) {
        // If it was hidden, we can unhide it
        if (existing.isHidden && domainTask.canHide) {
          existing.isHidden = false;
          existing.hiddenAt = undefined;
          await existing.save();
          return { success: true };
        }
        return { success: false, error: 'Task already assigned' };
      }

      // Check prerequisites
      if (domainTask.prerequisiteTasks && domainTask.prerequisiteTasks.length > 0) {
        const completedPrereqs = await UserPost.countDocuments({
          userId: request.userId,
          domainTaskId: { $in: domainTask.prerequisiteTasks },
          isCompleted: true
        });

        if (completedPrereqs < domainTask.prerequisiteTasks.length) {
          return { success: false, error: 'Prerequisites not met' };
        }
      }

      // Create QMS-compliant user task with COMPLETE snapshot of domain task
      const userTask = await UserPost.create({
        userId: request.userId,
        domainTaskId: request.taskId,
        masterTaskId: domainTask.masterTaskId, // Inherit masterTaskId from domain task
        taskSnapshot: {
          // Core content fields
          title: domainTask.title,
          description: domainTask.description,
          imageUrl: domainTask.imageUrl,
          version: domainTask.version,
          
          // Visual styling
          iconType: domainTask.iconType,
          colorScheme: domainTask.colorScheme,
          
          // CTA configuration
          ctaText: domainTask.ctaText,
          ctaAction: domainTask.ctaAction,
          
          // Behavior flags
          requiresIdentityVerification: domainTask.requiresIdentityVerification,
          canHide: domainTask.canHide,
          
          // Categorization
          taskType: domainTask.taskType,
          priority: domainTask.priority,
          category: domainTask.category,
          
          // Additional metadata
          estimatedTime: domainTask.estimatedTime,
          reward: domainTask.reward ? {
            amount: domainTask.reward.amount,
            currency: domainTask.reward.currency,
            displayText: domainTask.reward.displayText
          } : null,
          
          // Relationships (preserved for audit trail)
          prerequisiteTasks: domainTask.prerequisiteTasks,
          nextTasks: domainTask.nextTasks,
          
          // COMPLETE EXECUTION DATA (QMS Compliant)
          executionData: domainTask.masterTaskSnapshot ? {
            // Core execution fields
            executionModel: domainTask.masterTaskSnapshot.executionModel,
            
            // AI Configuration
            aiAgentAttached: domainTask.masterTaskSnapshot.aiAgentAttached,
            aiAgentRole: domainTask.masterTaskSnapshot.aiAgentRole,
            aiAgentId: domainTask.masterTaskSnapshot.aiAgentId,
            systemPrompt: domainTask.masterTaskSnapshot.systemPrompt,
            intro: domainTask.masterTaskSnapshot.intro,
            
            // Execution-specific data
            standardOperatingProcedure: domainTask.masterTaskSnapshot.standardOperatingProcedure,
            contextDocuments: domainTask.masterTaskSnapshot.contextDocuments,
            requiredParameters: domainTask.masterTaskSnapshot.requiredParameters,
            checklist: domainTask.masterTaskSnapshot.checklist,
            
            // Form execution
            formSchema: domainTask.masterTaskSnapshot.formSchema,
            validationRules: domainTask.masterTaskSnapshot.validationRules,
            
            // Workflow execution
            workflowDefinition: domainTask.masterTaskSnapshot.workflowDefinition,
            
            // Training execution
            curriculum: domainTask.masterTaskSnapshot.curriculum,
            
            // Metadata
            sopMetadata: domainTask.masterTaskSnapshot.sopMetadata
          } : null,
          
          // Domain customizations applied
          domainCustomizations: domainTask.domainCustomizations || {}
        },
        assignedTo: request.userId, // Who the task is assigned to
        assignedBy: request.assignedBy,
        assignmentReason: request.reason,
        isQMSCompliant: !!domainTask.masterTaskSnapshot?.executionModel, // Mark as QMS compliant if it has execution model
      });

      return { success: true };
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

  /**
   * Complete a task and trigger next tasks
   */
  static async completeTask(request: TaskCompletionRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userTask = await UserPost.findOne({
        _id: request.userTaskId,
        userId: request.userId
      });

      if (!userTask) {
        return { success: false, error: 'User task not found' };
      }

      if (userTask.isCompleted) {
        return { success: false, error: 'Task already completed' };
      }

      // Mark as completed
      userTask.isCompleted = true;
      userTask.completedAt = new Date();
      await userTask.save();

      // Get domain task for next tasks
      const domainTask = await Post.findById(userTask.domainTaskId);
      if (domainTask && domainTask.nextTasks && domainTask.nextTasks.length > 0) {
        // Assign next tasks
        for (const nextTaskId of domainTask.nextTasks) {
          await this.assignTask({
            userId: request.userId,
            taskId: nextTaskId,
            reason: `completed_${domainTask._id}`,
            assignedBy: 'system'
          });
        }
      }

      // Special handling for identity verification
      if (domainTask && domainTask.taskType === 'identity_verification') {
        console.log('Updating user identity verification in database for user:', request.userId);
        const updatedUser = await User.findByIdAndUpdate(
          request.userId, 
          {
            'identity.isVerified': true,
            'identity.verifiedAt': new Date(),
            'identity.verificationType': 'kyc', // This would come from the verification process
            'identity.verificationLevel': 'basic'
          },
          { new: true } // Return the updated document
        );
        console.log('User identity updated in database:', updatedUser?.identity);
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: 'Failed to complete task' };
    }
  }

  /**
   * Get tasks for user's home screen
   */
  static async getUserTasks(userId: string, options: TaskFilterOptions = {}): Promise<UserTaskDisplay[]> {
    console.log('TaskJourneyService.getUserTasks called with:', { userId, options });
    
    await connectToDatabase();

    try {
      // CRITICAL DEBUG: Let's see what's in the database
      const sampleUserTask = await UserPost.findOne({});
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
      const userTasks = await UserPost.find(query)
        .sort({ timestampAssigned: -1 })
        .limit(options.limit || 50);
        
      console.log('UserTasks found:', userTasks.length);

      // We still need to check if domain tasks are active and get domain info
      const taskIds = userTasks.map(ut => ut.domainTaskId);
      const domainTasks = await Post.find({ _id: { $in: taskIds } }, { isActive: 1, domain: 1 });
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

  /**
   * Toggle task visibility
   */
  static async toggleTaskVisibility(userId: string, userTaskId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userTask = await UserPost.findOne({
        _id: userTaskId,
        userId
      });

      if (!userTask) {
        return { success: false, error: 'User task not found' };
      }

      // Check if task can be hidden
      const domainTask = await Post.findById(userTask.domainTaskId);
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
      await UserPost.findOneAndUpdate(
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