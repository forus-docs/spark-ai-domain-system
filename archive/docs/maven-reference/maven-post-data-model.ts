/**
 * FORUS Digital Maven - Post Journey Data Model
 * 
 * This implements a journey-based post system where posts are assigned
 * to users rather than displayed directly from a master collection.
 */

// =====================================================
// Master Post Collection (Shared Across Domains)
// =====================================================

export interface MasterPost {
  // Firebase document ID
  id: string;
  
  // Domain this post belongs to
  domain: 'maven' | 'coop' | 'business' | 'marketplace';
  
  // Basic post information
  title: string;
  description: string;
  postType: MasterPostType;
  
  // Visual elements
  imageUrl: string; // 400x225px @ 72 DPI (16:9 ratio)
  iconEmoji?: string;
  
  // Navigation
  navigateTo?: string; // Internal app route
  externalContentUrl?: string; // External webpage
  
  // Journey configuration
  nextPosts: string[]; // Array of postIds to assign on completion
  prerequisitePosts?: string[]; // Posts that must be completed first
  canHide: boolean; // Whether user can hide this post
  
  // Pricing (if applicable)
  price?: {
    amount: number;
    currency: string;
    displayText: string; // e.g., "Free", "$10 one-time"
  };
  
  // SOP integration
  sopReference?: {
    sopId: string; // References forus-context collection
    sopFileName: string;
    sopVersion: string;
    actionType: 'read' | 'complete' | 'acknowledge';
  };
  
  // Access control
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  
  // Automation rules
  triggerConditions?: {
    onEvent: TriggerEvent;
    additionalCriteria?: Record<string, any>;
  };
  
  // Groups to create on completion
  groupsToCreate?: GroupTemplate[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string;
  isActive: boolean;
}

export type MasterPostType = 
  | 'onboarding'
  | 'sop_training'
  | 'sop_update'
  | 'maven_assignment'
  | 'achievement'
  | 'announcement'
  | 'compliance'
  | 'community';

export type TriggerEvent = 
  | 'user_registered'
  | 'became_member'
  | 'became_maven'
  | 'completed_post'
  | 'sop_updated'
  | 'achievement_unlocked'
  | 'time_based';

export interface GroupTemplate {
  groupName: string;
  groupType: 'support' | 'project' | 'expertise' | 'regional';
  members?: string[]; // Predefined members (emails/ids)
  addCurrentUser: boolean;
}

// =====================================================
// User Journey Posts (Assigned to Users)
// =====================================================

export interface UserPost {
  // Firebase document ID
  id: string;
  
  // Reference to master post
  postId: string; // ID of master post
  postSnapshot: MasterPostSnapshot; // Cached data for audit trail
  
  // Assignment details
  assignedAt: Date;
  assignedBy: 'system' | 'admin' | 'maven_leader';
  assignmentReason: string; // e.g., "completed_member_registration"
  
  // User interaction
  isHidden: boolean;
  hiddenAt?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  interactionCount: number;
  lastInteractionAt?: Date;
  
  // Progress tracking
  progressData?: {
    currentStep: number;
    totalSteps: number;
    stepsCompleted: string[]; // Step IDs
    percentComplete: number;
    estimatedTimeRemaining?: number; // minutes
  };
  
  // Journey context
  journeyContext: {
    journeyId: string; // e.g., "maven_onboarding"
    journeyPhase: JourneyPhase;
    triggeredBy: string; // What caused this assignment
    relatedPosts?: string[]; // Other posts in this journey
  };
  
  // Persistence for forms/SOPs
  persistenceData?: Record<string, any>; // JSON object for form data
  
  // Analytics
  viewDuration?: number; // Total seconds spent
  completionMethod?: 'manual' | 'automatic' | 'verified';
  deviceType?: 'mobile' | 'tablet';
}

export type JourneyPhase = 
  | 'discovery'
  | 'onboarding'
  | 'activation'
  | 'growth'
  | 'retention'
  | 'expert';

// Snapshot of master post data at assignment time
export interface MasterPostSnapshot {
  title: string;
  description: string;
  imageUrl: string;
  version: string;
  price?: MasterPost['price'];
}

// =====================================================
// Post Assignment Service Types
// =====================================================

export interface PostAssignmentRequest {
  userId: string;
  postId: string;
  reason: string;
  triggeredBy: 'system' | 'admin' | 'completion' | 'schedule';
  journeyContext?: Partial<UserPost['journeyContext']>;
}

export interface PostAssignmentResult {
  success: boolean;
  userPostId?: string;
  alreadyAssigned?: boolean;
  error?: string;
}

// =====================================================
// Home Screen Display Types
// =====================================================

export interface UserPostDisplay extends UserPost {
  // Enriched data for display
  masterPost: MasterPost; // Current master post data
  displayPriority: 'urgent' | 'high' | 'normal' | 'low';
  categoryGroup: PostCategoryGroup;
  isNew: boolean; // Assigned in last 24 hours
  hasUpdates: boolean; // Master post updated since assignment
}

export type PostCategoryGroup = 
  | 'action_required'
  | 'training'
  | 'opportunities'
  | 'community'
  | 'achievements';

// =====================================================
// Journey Management Types
// =====================================================

export interface MavenJourney {
  id: string;
  name: string;
  description: string;
  phases: JourneyPhaseConfig[];
  requiredPosts: string[]; // Must complete these
  optionalPosts: string[]; // Can be hidden
  estimatedDuration: number; // days
}

export interface JourneyPhaseConfig {
  phase: JourneyPhase;
  name: string;
  posts: string[];
  completionCriteria: 'all' | 'any' | number; // number = minimum posts
  unlocks: string[]; // Features/permissions unlocked
}

// =====================================================
// Service Methods
// =====================================================

export class PostJourneyService {
  /**
   * Assign a post to a user's journey
   */
  static async assignPost(request: PostAssignmentRequest): Promise<PostAssignmentResult> {
    // 1. Check if post exists in master collection
    // 2. Check if user already has this post
    // 3. Check prerequisites
    // 4. Create userPost document
    // 5. Handle any side effects (groups, notifications)
    return { success: true };
  }

  /**
   * Complete a user's post and trigger next posts
   */
  static async completePost(userId: string, userPostId: string): Promise<void> {
    // 1. Mark post as completed
    // 2. Get nextPosts from master post
    // 3. Assign each next post
    // 4. Create any specified groups
    // 5. Check for journey phase completion
  }

  /**
   * Get posts for home screen display
   */
  static async getHomeScreenPosts(userId: string): Promise<UserPostDisplay[]> {
    // Query: isCompleted == false AND isHidden == false
    // Enrich with master post data
    // Sort by priority and assignedAt
    // Group by category
    return [];
  }

  /**
   * Hide/unhide a post
   */
  static async togglePostVisibility(userId: string, userPostId: string): Promise<void> {
    // Check if post can be hidden
    // Update isHidden flag
    // Log action for analytics
  }
}

// =====================================================
// Initial Maven Posts
// =====================================================

export const MAVEN_INITIAL_POSTS: Partial<MasterPost>[] = [
  {
    domain: 'maven',
    title: 'Become a FORUS Maven',
    description: 'Complete your Maven onboarding to start helping others navigate FORUS SOPs and earn rewards.',
    postType: 'onboarding',
    canHide: false, // Required post
    nextPosts: ['maven-profile-setup', 'maven-code-of-conduct'],
    price: { amount: 0, currency: 'USD', displayText: 'Free' },
    triggerConditions: {
      onEvent: 'user_registered'
    }
  },
  {
    domain: 'maven',
    title: 'Complete Your Maven Profile',
    description: 'Set up your areas of expertise, availability, and communication preferences.',
    postType: 'onboarding',
    canHide: true,
    navigateTo: '/maven/profile',
    nextPosts: ['maven-sop-training', 'maven-expertise-selection'],
    sopReference: {
      sopId: 'maven-profile-setup-sop',
      sopFileName: 'maven-profile-setup-sop.md',
      sopVersion: '001.000',
      actionType: 'complete'
    }
  },
  {
    domain: 'maven',
    title: 'Maven SOP Training',
    description: 'Learn how to guide users through Standard Operating Procedures effectively.',
    postType: 'sop_training',
    canHide: false,
    nextPosts: ['maven-first-assignment'],
    sopReference: {
      sopId: 'maven-training-sop',
      sopFileName: 'maven-training-sop.md',
      sopVersion: '001.002',
      actionType: 'complete'
    },
    groupsToCreate: [{
      groupName: 'Maven Training Cohort {MONTH} {YEAR}',
      groupType: 'support',
      addCurrentUser: true
    }]
  }
];