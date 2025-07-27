import { 
  TaskAssignmentRequest, 
  TaskCompletionRequest, 
  TaskFilterOptions,
  UserTaskDisplay
} from '@/app/types/post.types';
import { TaskAssignmentService } from './task-assignment.service';
import { TaskCompletionService } from './task-completion.service';
import { TaskDisplayService } from './task-display.service';
import { TaskInteractionService } from './task-interaction.service';

/**
 * TaskJourneyService - Facade for task-related operations
 * 
 * This service delegates to specialized services for better maintainability
 * while preserving the existing API for backward compatibility.
 */
export class TaskJourneyService {
  /**
   * Initialize tasks for a new user
   * UPDATE: No automatic task assignment - all tasks are user-initiated
   */
  static async initializeUserTasks(userId: string): Promise<void> {
    return TaskInteractionService.initializeUserTasks(userId);
  }

  /**
   * Assign a task to a user
   */
  static async assignTask(request: TaskAssignmentRequest): Promise<{ success: boolean; error?: string }> {
    return TaskAssignmentService.assignTask(request);
  }

  /**
   * Complete a task and trigger next tasks
   */
  static async completeTask(request: TaskCompletionRequest): Promise<{ success: boolean; error?: string }> {
    return TaskCompletionService.completeTask(request);
  }

  /**
   * Get tasks for user's home screen
   */
  static async getUserTasks(userId: string, options: TaskFilterOptions = {}): Promise<UserTaskDisplay[]> {
    return TaskDisplayService.getUserTasks(userId, options);
  }

  /**
   * Toggle task visibility
   */
  static async toggleTaskVisibility(userId: string, userTaskId: string): Promise<{ success: boolean; error?: string }> {
    return TaskInteractionService.toggleTaskVisibility(userId, userTaskId);
  }

  /**
   * Mark task as viewed
   */
  static async markTaskViewed(userId: string, userTaskId: string): Promise<void> {
    return TaskInteractionService.markTaskViewed(userId, userTaskId);
  }

  /**
   * Assign domain-specific onboarding tasks
   * UPDATE: Now all domains use user-initiated assignment - no automatic assignment
   */
  static async assignDomainOnboardingTasks(userId: string, domainId: string): Promise<void> {
    return TaskInteractionService.assignDomainOnboardingTasks(userId, domainId);
  }
}