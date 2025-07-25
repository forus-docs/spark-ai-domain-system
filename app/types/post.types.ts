/**
 * Generic Task Journey System Types
 * Used across all domains for personalized home screens
 */

// =====================================================
// Master Task Collection (Shared Across All Domains)
// =====================================================

export interface MasterTask {
  // Firebase document ID
  id: string;
  
  // Domain this task belongs to
  domain: 'maven-hub' | 'wealth-on-wheels' | 'bemnet' | 'pacci' | string;
  
  // Basic task information
  title: string;
  description: string;
  taskType: TaskType;
  
  // Foreign key to MasterTask collection (optional)
  masterTaskId?: string; // Links to masterTask.processId when ctaAction.type === 'process'
  
  // Visual elements
  imageUrl?: string; // Optional image
  iconType?: TaskIcon; // Icon-based alternative
  colorScheme?: TaskColorScheme; // For visual variety
  
  // Navigation
  ctaText: string; // Call to action text
  ctaAction: TaskAction; // What happens when CTA is clicked
  
  // Requirements
  requiresIdentityVerification: boolean; // If true, CTA is disabled until verified
  prerequisiteTasks?: string[]; // Tasks that must be completed first
  
  // Journey configuration
  nextTasks?: string[]; // Array of taskIds to assign on completion
  canHide: boolean; // Whether user can hide this task
  
  // Display configuration
  priority: TaskPriority;
  category: TaskCategory;
  estimatedTime?: string; // e.g., "5 min", "30 min"
  
  // Rewards (if applicable)
  reward?: {
    amount: number;
    currency: string;
    displayText: string; // e.g., "50 MHX", "Free"
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string;
  isActive: boolean;
}

// Domain Task interface (tasks adopted by domains from master tasks)
export interface DomainTask extends MasterTask {
  // Reference to the master task template
  originalMasterTaskId: string;
  masterTaskVersion: string; // Version of MasterTask at adoption time
  
  // QMS-Compliant: Complete snapshot of MasterTask execution data
  masterTaskSnapshot?: {
    name: string;
    category: string;
    executionModel: string;
    currentStage: string;
    aiAgentAttached: boolean;
    aiAgentRole?: string;
    aiAgentId?: string;
    systemPrompt?: string;
    intro?: string;
    standardOperatingProcedure?: any;
    contextDocuments?: any[];
    requiredParameters?: any[];
    checklist?: any[];
    formSchema?: any;
    validationRules?: any;
    workflowDefinition?: any;
    curriculum?: any[];
    sopMetadata?: any;
  };
  
  // Domain-specific customizations
  domainCustomizations?: {
    title?: string;
    description?: string;
    estimatedTime?: string;
    systemPrompt?: string;
    additionalContext?: string;
    reward?: {
      amount: number;
      currency: string;
      displayText: string;
    };
  };
  
  // Domain adoption metadata
  adoptedAt: Date;
  adoptedBy: string;
  adoptionNotes?: string;
  isActiveInDomain: boolean;
  isQMSCompliant?: boolean;
}


export type TaskType = 
  | 'identity_verification'
  | 'onboarding'
  | 'training'
  | 'task'
  | 'achievement'
  | 'announcement'
  | 'opportunity'
  | 'compliance';

export type TaskIcon = 
  | 'shield' // Identity/security
  | 'book' // Training
  | 'checklist' // Tasks
  | 'trophy' // Achievements
  | 'megaphone' // Announcements
  | 'lightbulb' // Opportunities
  | 'briefcase' // Business
  | 'users' // Community;

export type TaskColorScheme = 
  | 'blue' // Primary actions
  | 'green' // Success/completed
  | 'orange' // Warnings/important
  | 'purple' // Special/premium
  | 'gray'; // Disabled/inactive

export type TaskAction = {
  type: 'navigate' | 'external' | 'modal' | 'process';
  target: string; // Route, URL, or process ID
  params?: Record<string, any>;
};

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';

export type TaskCategory = 
  | 'required' // Must complete
  | 'recommended' // Should complete
  | 'optional'; // Nice to have

// =====================================================
// User Tasks (Assigned to Individual Users)
// =====================================================

export interface UserTask {
  // Firebase document ID
  id: string;
  
  // User this task is assigned to
  userId: string;
  
  // Reference to domain task
  domainTaskId: string; // ID of domain task
  masterTaskId?: string; // Inherited from domain task at assignment time
  taskSnapshot: DomainTaskSnapshot; // Cached data at assignment time
  
  // Assignment details
  timestampAssigned: Date;
  assignedTo: string; // User ID of who the task is assigned to
  assignedBy: 'system' | 'admin' | string; // Who assigned the task
  assignmentReason: string; // e.g., "user_registered", "completed_task_xyz", "self-assigned"
  
  // User interaction
  isHidden: boolean;
  hiddenAt?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  lastViewedAt?: Date;
  viewCount: number;
  
  // Progress tracking (for multi-step tasks)
  progress?: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
  };
  
  // QMS compliance flag
  isQMSCompliant?: boolean;
}

// Snapshot of domain task data at assignment time
export interface DomainTaskSnapshot {
  // Core content fields
  title: string;
  description: string;
  imageUrl?: string;
  version: string;
  
  // Visual styling
  iconType?: TaskIcon;
  colorScheme?: TaskColorScheme;
  
  // CTA configuration
  ctaText: string;
  ctaAction: TaskAction;
  
  // Behavior flags
  requiresIdentityVerification: boolean;
  canHide: boolean;
  
  // Categorization
  taskType: TaskType;
  priority: TaskPriority;
  category: TaskCategory;
  
  // Additional metadata
  estimatedTime?: string;
  reward?: {
    amount: number;
    currency: string;
    displayText: string;
  };
  
  // Relationships (preserved for audit trail)
  prerequisiteTasks?: string[];
  nextTasks?: string[];
  
  // QMS-Compliant: Complete execution data from MasterTask
  executionData?: {
    executionModel: string;
    currentStage: string;
    aiAgentAttached: boolean;
    aiAgentRole?: string;
    aiAgentId?: string;
    systemPrompt?: string;
    intro?: string;
    standardOperatingProcedure?: any;
    contextDocuments?: any[];
    requiredParameters?: any[];
    checklist?: any[];
    formSchema?: any;
    validationRules?: any;
    workflowDefinition?: any;
    curriculum?: any[];
    sopMetadata?: any;
  };
  
  // Domain customizations applied
  domainCustomizations?: {
    title?: string;
    description?: string;
    estimatedTime?: string;
    systemPrompt?: string;
    additionalContext?: string;
    reward?: {
      amount: number;
      currency: string;
      displayText: string;
    };
  };
}

// =====================================================
// User Identity State (Stored in User model)
// =====================================================

export interface UserIdentityState {
  isIdentityVerified: boolean;
  verifiedAt?: Date;
  verificationType?: 'kyc' | 'email' | 'phone' | 'document';
  verificationLevel?: 'basic' | 'standard' | 'enhanced';
}

// =====================================================
// Display Types for UI
// =====================================================

export interface UserTaskDisplay extends UserTask {
  // Enriched with current domain task data
  domainTask: DomainTask;
  
  // Computed display properties
  isNew: boolean; // Assigned in last 24 hours
  isUrgent: boolean; // Based on priority and deadlines
  canInteract: boolean; // Based on identity verification and prerequisites
  ctaEnabled: boolean; // Whether CTA button is clickable
  ctaTooltip?: string; // Explanation if CTA is disabled
}

// =====================================================
// Service Method Types
// =====================================================

export interface TaskAssignmentRequest {
  userId: string;
  taskId: string;
  reason: string;
  assignedBy: 'system' | 'admin' | string;
}

export interface TaskCompletionRequest {
  userId: string;
  userTaskId: string;
  completionData?: Record<string, any>;
}

export interface TaskFilterOptions {
  includeHidden?: boolean;
  includeCompleted?: boolean;
  domain?: string;
  category?: TaskCategory;
  limit?: number;
}

// =====================================================
// Initial Identity Verification Task
// =====================================================

export const IDENTITY_VERIFICATION_TASK: Partial<MasterTask> = {
  domain: 'all', // Special domain for cross-domain tasks
  title: 'Verify Your Identity',
  description: 'Complete identity verification to unlock all features and enable transactions',
  taskType: 'identity_verification',
  iconType: 'shield',
  colorScheme: 'orange',
  ctaText: 'Start Verification',
  ctaAction: {
    type: 'navigate',
    target: '/identity-verification'
  },
  requiresIdentityVerification: false, // This post itself doesn't require verification
  canHide: false, // Cannot be hidden
  priority: 'urgent',
  category: 'required',
  estimatedTime: '5 min'
};

