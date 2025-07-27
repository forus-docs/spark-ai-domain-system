import DomainTask from '@/app/models/DomainTask';
import UserTask from '@/app/models/UserTask';
import User from '@/app/models/User';
import { TaskCompletionRequest } from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';
import { TaskAssignmentService } from './task-assignment.service';

export class TaskCompletionService {
  /**
   * Complete a task and trigger next tasks
   */
  static async completeTask(request: TaskCompletionRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userTask = await UserTask.findOne({
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
      const domainTask = await DomainTask.findById(userTask.domainTaskId);
      if (domainTask && domainTask.nextTasks && domainTask.nextTasks.length > 0) {
        // Assign next tasks
        for (const nextTaskId of domainTask.nextTasks) {
          await TaskAssignmentService.assignTask({
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
}