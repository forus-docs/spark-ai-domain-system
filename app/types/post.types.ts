/**
 * Generic Post Journey System Types
 * Used across all domains for personalized home screens
 */

// =====================================================
// Master Post Collection (Shared Across All Domains)
// =====================================================

export interface MasterPost {
  // Firebase document ID
  id: string;
  
  // Domain this post belongs to
  domain: 'maven-hub' | 'wealth-on-wheels' | 'bemnet' | 'pacci' | string;
  
  // Basic post information
  title: string;
  description: string;
  postType: PostType;
  
  // Foreign key to Process collection (optional)
  processId?: string; // Links to process.processId when ctaAction.type === 'process'
  
  // Visual elements
  imageUrl?: string; // Optional image
  iconType?: PostIcon; // Icon-based alternative
  colorScheme?: PostColorScheme; // For visual variety
  
  // Navigation
  ctaText: string; // Call to action text
  ctaAction: PostAction; // What happens when CTA is clicked
  
  // Requirements
  requiresIdentityVerification: boolean; // If true, CTA is disabled until verified
  prerequisitePosts?: string[]; // Posts that must be completed first
  
  // Journey configuration
  nextPosts?: string[]; // Array of postIds to assign on completion
  canHide: boolean; // Whether user can hide this post
  
  // Display configuration
  priority: PostPriority;
  category: PostCategory;
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

export type PostType = 
  | 'identity_verification'
  | 'onboarding'
  | 'training'
  | 'task'
  | 'achievement'
  | 'announcement'
  | 'opportunity'
  | 'compliance';

export type PostIcon = 
  | 'shield' // Identity/security
  | 'book' // Training
  | 'checklist' // Tasks
  | 'trophy' // Achievements
  | 'megaphone' // Announcements
  | 'lightbulb' // Opportunities
  | 'briefcase' // Business
  | 'users' // Community;

export type PostColorScheme = 
  | 'blue' // Primary actions
  | 'green' // Success/completed
  | 'orange' // Warnings/important
  | 'purple' // Special/premium
  | 'gray'; // Disabled/inactive

export type PostAction = {
  type: 'navigate' | 'external' | 'modal' | 'process';
  target: string; // Route, URL, or process ID
  params?: Record<string, any>;
};

export type PostPriority = 'urgent' | 'high' | 'normal' | 'low';

export type PostCategory = 
  | 'required' // Must complete
  | 'recommended' // Should complete
  | 'optional'; // Nice to have

// =====================================================
// User Journey Posts (Assigned to Individual Users)
// =====================================================

export interface UserPost {
  // Firebase document ID
  id: string;
  
  // User this post is assigned to
  userId: string;
  
  // Reference to master post
  postId: string; // ID of master post
  processId?: string; // Inherited from master post at assignment time
  postSnapshot: MasterPostSnapshot; // Cached data at assignment time
  
  // Assignment details
  assignedAt: Date;
  assignedBy: 'system' | 'admin' | string;
  assignmentReason: string; // e.g., "user_registered", "completed_post_xyz"
  
  // User interaction
  isHidden: boolean;
  hiddenAt?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  lastViewedAt?: Date;
  viewCount: number;
  
  // Progress tracking (for multi-step posts)
  progress?: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
  };
}

// Snapshot of master post data at assignment time
export interface MasterPostSnapshot {
  // Core content fields
  title: string;
  description: string;
  imageUrl?: string;
  version: string;
  
  // Visual styling
  iconType?: PostIcon;
  colorScheme?: PostColorScheme;
  
  // CTA configuration
  ctaText: string;
  ctaAction: PostAction;
  
  // Behavior flags
  requiresIdentityVerification: boolean;
  canHide: boolean;
  
  // Categorization
  postType: PostType;
  priority: PostPriority;
  category: PostCategory;
  
  // Additional metadata
  estimatedTime?: string;
  reward?: {
    amount: number;
    currency: string;
    displayText: string;
  };
  
  // Relationships (preserved for audit trail)
  prerequisitePosts?: string[];
  nextPosts?: string[];
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

export interface UserPostDisplay extends UserPost {
  // Enriched with current master post data
  masterPost: MasterPost;
  
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

export interface PostAssignmentRequest {
  userId: string;
  postId: string;
  reason: string;
  assignedBy: 'system' | 'admin' | string;
}

export interface PostCompletionRequest {
  userId: string;
  userPostId: string;
  completionData?: Record<string, any>;
}

export interface PostFilterOptions {
  includeHidden?: boolean;
  includeCompleted?: boolean;
  domain?: string;
  category?: PostCategory;
  limit?: number;
}

// =====================================================
// Initial Identity Verification Post
// =====================================================

export const IDENTITY_VERIFICATION_POST: Partial<MasterPost> = {
  domain: 'all', // Special domain for cross-domain posts
  title: 'Verify Your Identity',
  description: 'Complete identity verification to unlock all features and enable transactions',
  postType: 'identity_verification',
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