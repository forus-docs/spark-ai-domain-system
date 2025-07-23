import mongoose, { Document, Schema } from 'mongoose';
import { UserPost, MasterPostSnapshot } from '@/app/types/post.types';

/**
 * UserPost Model
 * 
 * Represents an instance of a post assigned to a specific user.
 * Contains a complete snapshot of the master post data at the time of assignment.
 * 
 * DESIGN PRINCIPLE: UserPosts are immutable snapshots
 * - When created, they capture ALL relevant fields from the master post
 * - Changes to master posts do NOT affect existing UserPosts
 * - This ensures audit integrity and consistent user experience
 * - Users always see the exact content that was assigned to them
 * 
 * The only fields that reference current state are:
 * - postId: Reference to the master post (for admin tracking)
 * - processId: Reference to the process (inherited at assignment)
 * - Master post's isActive status (checked at display time)
 * - Master post's domain (for filtering)
 */
export interface IUserPost extends Document, Omit<UserPost, 'id'> {
  _id: string;
  processId?: string; // Inherited from Post at assignment time
}

const PostActionSnapshotSchema = new Schema({
  type: {
    type: String,
    enum: ['navigate', 'external', 'modal', 'process'],
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  params: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, { _id: false });

const MasterPostSnapshotSchema = new Schema({
  // Core content fields
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: String,
  version: {
    type: String,
    required: true,
  },
  
  // Visual styling
  iconType: {
    type: String,
    enum: ['shield', 'book', 'checklist', 'trophy', 'megaphone', 'lightbulb', 'briefcase', 'users'],
  },
  colorScheme: {
    type: String,
    enum: ['blue', 'green', 'orange', 'purple', 'gray'],
    default: 'blue',
  },
  
  // CTA configuration
  ctaText: {
    type: String,
    required: true,
  },
  ctaAction: {
    type: PostActionSnapshotSchema,
    required: true,
  },
  
  // Behavior flags
  requiresIdentityVerification: {
    type: Boolean,
    default: true,
  },
  canHide: {
    type: Boolean,
    default: true,
  },
  
  // Categorization
  postType: {
    type: String,
    enum: ['identity_verification', 'onboarding', 'training', 'task', 'achievement', 'announcement', 'opportunity', 'compliance'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal',
  },
  category: {
    type: String,
    enum: ['required', 'recommended', 'optional'],
    default: 'recommended',
  },
  
  // Additional metadata
  estimatedTime: String,
  reward: {
    amount: Number,
    currency: String,
    displayText: String,
  },
  
  // Relationships (preserved for audit trail)
  prerequisitePosts: [{
    type: String,
  }],
  nextPosts: [{
    type: String,
  }],
}, { _id: false });

const UserPostSchema = new Schema<IUserPost>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  postId: {
    type: String,
    required: true,
    ref: 'Post',
  },
  // Inherited from Post document at assignment time
  processId: {
    type: String,
    ref: 'Process',
    index: true,
    // Optional because not all posts have processes
  },
  postSnapshot: {
    type: MasterPostSnapshotSchema,
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  assignedBy: {
    type: String,
    required: true,
    default: 'system',
  },
  assignmentReason: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenAt: Date,
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  lastViewedAt: Date,
  viewCount: {
    type: Number,
    default: 0,
  },
  progress: {
    currentStep: {
      type: Number,
      default: 0,
    },
    totalSteps: {
      type: Number,
      default: 1,
    },
    percentComplete: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
UserPostSchema.index({ userId: 1, isCompleted: 1, isHidden: 1, assignedAt: -1 });
UserPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.models.UserPost || mongoose.model<IUserPost>('UserPost', UserPostSchema);