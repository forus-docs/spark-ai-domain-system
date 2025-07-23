import mongoose, { Document, Schema } from 'mongoose';
import { MasterPost, PostType, PostIcon, PostColorScheme, PostPriority, PostCategory } from '@/app/types/post.types';

/**
 * Master Post Model
 * 
 * This represents the "template" or "master copy" of a post.
 * When a post is assigned to a user, a UserPost is created with a complete
 * snapshot of all relevant fields from this master post.
 * 
 * IMPORTANT: Changes to master posts do NOT automatically propagate to existing
 * UserPosts. This is by design to ensure audit integrity and consistent user
 * experience. If you need to update UserPosts after changing a master post,
 * you must run a migration script.
 */
export interface IPost extends Document, Omit<MasterPost, 'id'> {
  _id: string;
  processId?: string; // Foreign key to Process collection
}

const PostActionSchema = new Schema({
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

const PostSchema = new Schema<IPost>({
  domain: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  postType: {
    type: String,
    enum: ['identity_verification', 'onboarding', 'training', 'task', 'achievement', 'announcement', 'opportunity', 'compliance'],
    required: true,
  },
  // Foreign key reference to Process collection
  processId: {
    type: String,
    ref: 'Process',
    index: true,
    // Not required because some posts don't trigger processes
  },
  imageUrl: String,
  iconType: {
    type: String,
    enum: ['shield', 'book', 'checklist', 'trophy', 'megaphone', 'lightbulb', 'briefcase', 'users'],
  },
  colorScheme: {
    type: String,
    enum: ['blue', 'green', 'orange', 'purple', 'gray'],
    default: 'blue',
  },
  ctaText: {
    type: String,
    required: true,
  },
  ctaAction: {
    type: PostActionSchema,
    required: true,
  },
  requiresIdentityVerification: {
    type: Boolean,
    default: true,
  },
  prerequisitePosts: [{
    type: String,
  }],
  nextPosts: [{
    type: String,
  }],
  canHide: {
    type: Boolean,
    default: true,
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
  estimatedTime: String,
  reward: {
    amount: Number,
    currency: String,
    displayText: String,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
PostSchema.index({ domain: 1, isActive: 1, priority: -1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);