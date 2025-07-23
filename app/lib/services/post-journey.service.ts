import Post from '@/app/models/Post';
import UserPost from '@/app/models/UserPost';
import User from '@/app/models/User';
import { 
  PostAssignmentRequest, 
  PostCompletionRequest, 
  PostFilterOptions,
  UserPostDisplay,
  IDENTITY_VERIFICATION_POST
} from '@/app/types/post.types';
import { connectToDatabase } from '@/app/lib/database';

export class PostJourneyService {
  /**
   * Initialize posts for a new user
   * UPDATE: No automatic post assignment - all posts are user-initiated
   */
  static async initializeUserPosts(userId: string): Promise<void> {
    await connectToDatabase();

    // No automatic post assignments
    // Users will see all posts as unassigned and can choose what to engage with
    console.log(`User ${userId} initialized - no posts auto-assigned`);
  }

  /**
   * Assign a post to a user
   */
  static async assignPost(request: PostAssignmentRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();
    
    let masterPost: any;

    try {
      // Check if post exists
      masterPost = await Post.findById(request.postId);
      if (!masterPost || !masterPost.isActive) {
        return { success: false, error: 'Post not found or inactive' };
      }

      // Check if already assigned
      const existing = await UserPost.findOne({
        userId: request.userId,
        postId: request.postId
      });

      if (existing) {
        // If it was hidden, we can unhide it
        if (existing.isHidden && masterPost.canHide) {
          existing.isHidden = false;
          existing.hiddenAt = undefined;
          await existing.save();
          return { success: true };
        }
        return { success: false, error: 'Post already assigned' };
      }

      // Check prerequisites
      if (masterPost.prerequisitePosts && masterPost.prerequisitePosts.length > 0) {
        const completedPrereqs = await UserPost.countDocuments({
          userId: request.userId,
          postId: { $in: masterPost.prerequisitePosts },
          isCompleted: true
        });

        if (completedPrereqs < masterPost.prerequisitePosts.length) {
          return { success: false, error: 'Prerequisites not met' };
        }
      }

      // Create user post with complete snapshot of master post
      const userPost = await UserPost.create({
        userId: request.userId,
        postId: request.postId,
        processId: masterPost.processId, // Inherit processId from master post
        postSnapshot: {
          // Core content fields
          title: masterPost.title,
          description: masterPost.description,
          imageUrl: masterPost.imageUrl,
          version: masterPost.version,
          
          // Visual styling
          iconType: masterPost.iconType,
          colorScheme: masterPost.colorScheme,
          
          // CTA configuration
          ctaText: masterPost.ctaText,
          ctaAction: masterPost.ctaAction,
          
          // Behavior flags
          requiresIdentityVerification: masterPost.requiresIdentityVerification,
          canHide: masterPost.canHide,
          
          // Categorization
          postType: masterPost.postType,
          priority: masterPost.priority,
          category: masterPost.category,
          
          // Additional metadata
          estimatedTime: masterPost.estimatedTime,
          reward: masterPost.reward,
          
          // Relationships (preserved for audit trail)
          prerequisitePosts: masterPost.prerequisitePosts,
          nextPosts: masterPost.nextPosts,
        },
        assignedBy: request.assignedBy,
        assignmentReason: request.reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning post:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: request.userId,
        postId: request.postId,
        masterPostId: masterPost?._id
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign post' };
    }
  }

  /**
   * Complete a post and trigger next posts
   */
  static async completePost(request: PostCompletionRequest): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userPost = await UserPost.findOne({
        _id: request.userPostId,
        userId: request.userId
      });

      if (!userPost) {
        return { success: false, error: 'User post not found' };
      }

      if (userPost.isCompleted) {
        return { success: false, error: 'Post already completed' };
      }

      // Mark as completed
      userPost.isCompleted = true;
      userPost.completedAt = new Date();
      await userPost.save();

      // Get master post for next posts
      const masterPost = await Post.findById(userPost.postId);
      if (masterPost && masterPost.nextPosts && masterPost.nextPosts.length > 0) {
        // Assign next posts
        for (const nextPostId of masterPost.nextPosts) {
          await this.assignPost({
            userId: request.userId,
            postId: nextPostId,
            reason: `completed_${masterPost._id}`,
            assignedBy: 'system'
          });
        }
      }

      // Special handling for identity verification
      if (masterPost && masterPost.postType === 'identity_verification') {
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
      console.error('Error completing post:', error);
      return { success: false, error: 'Failed to complete post' };
    }
  }

  /**
   * Get posts for user's home screen
   */
  static async getUserPosts(userId: string, options: PostFilterOptions = {}): Promise<UserPostDisplay[]> {
    console.log('PostJourneyService.getUserPosts called with:', { userId, options });
    
    await connectToDatabase();

    try {
      // CRITICAL DEBUG: Let's see what's in the database
      const sampleUserPost = await UserPost.findOne({});
      console.log('DEBUG - Sample UserPost from DB:', {
        _id: sampleUserPost?._id,
        userId: sampleUserPost?.userId,
        userIdType: typeof sampleUserPost?.userId,
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

      console.log('UserPost query:', JSON.stringify(query));

      // Get user posts
      const userPosts = await UserPost.find(query)
        .sort({ assignedAt: -1 })
        .limit(options.limit || 50);
        
      console.log('UserPosts found:', userPosts.length);

      // We still need to check if master posts are active and get domain info
      const postIds = userPosts.map(up => up.postId);
      const masterPosts = await Post.find({ _id: { $in: postIds } }, { isActive: 1, domain: 1 });
      const masterPostMap = new Map(masterPosts.map(p => [p._id.toString(), p]));
      

      // Get user for identity verification check
      const user = await User.findById(userId);
      const isIdentityVerified = user?.identity?.isVerified || false;

      // Build display objects
      const displayPosts: UserPostDisplay[] = [];
      
      for (const userPost of userPosts) {
        const masterPost = masterPostMap.get(userPost.postId);
        
        // Skip if master post is no longer active
        if (!masterPost || !masterPost.isActive) continue;

        // Apply domain filter if specified (using master post domain)
        if (options.domain && masterPost.domain !== options.domain && masterPost.domain !== 'all') {
          continue;
        }

        // Use snapshot data for display, but check identity verification against user's current status
        const snapshot = userPost.postSnapshot;
        const ctaEnabled = !snapshot.requiresIdentityVerification || isIdentityVerified;
        
        // Convert to plain object to avoid Mongoose document issues
        const userPostObj = userPost.toObject();
        const snapshotObj = userPostObj.postSnapshot;
        
        const displayPost = {
          ...userPostObj,
          id: userPost._id.toString(),
          masterPost: {
            // Use snapshot data for all display fields
            id: userPost.postId, // Keep reference to original post ID
            domain: masterPost.domain, // Use current domain from master
            ...snapshotObj, // All other fields from snapshot
          },
          isNew: (Date.now() - userPost.assignedAt.getTime()) < 24 * 60 * 60 * 1000,
          isUrgent: snapshotObj.priority === 'urgent',
          canInteract: ctaEnabled,
          ctaEnabled,
          ctaTooltip: !ctaEnabled ? 'Complete identity verification to access this feature' : undefined
        };
        
        displayPosts.push(displayPost);
      }

      // Sort by priority and date
      displayPosts.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const aPriority = priorityOrder[a.masterPost.priority];
        const bPriority = priorityOrder[b.masterPost.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return b.assignedAt.getTime() - a.assignedAt.getTime();
      });

      return displayPosts;
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  /**
   * Toggle post visibility
   */
  static async togglePostVisibility(userId: string, userPostId: string): Promise<{ success: boolean; error?: string }> {
    await connectToDatabase();

    try {
      const userPost = await UserPost.findOne({
        _id: userPostId,
        userId
      });

      if (!userPost) {
        return { success: false, error: 'User post not found' };
      }

      // Check if post can be hidden
      const masterPost = await Post.findById(userPost.postId);
      if (!masterPost?.canHide) {
        return { success: false, error: 'This post cannot be hidden' };
      }

      userPost.isHidden = !userPost.isHidden;
      userPost.hiddenAt = userPost.isHidden ? new Date() : undefined;
      await userPost.save();

      return { success: true };
    } catch (error) {
      console.error('Error toggling post visibility:', error);
      return { success: false, error: 'Failed to toggle visibility' };
    }
  }

  /**
   * Mark post as viewed
   */
  static async markPostViewed(userId: string, userPostId: string): Promise<void> {
    await connectToDatabase();

    try {
      await UserPost.findOneAndUpdate(
        { _id: userPostId, userId },
        {
          $set: { lastViewedAt: new Date() },
          $inc: { viewCount: 1 }
        }
      );
    } catch (error) {
      console.error('Error marking post as viewed:', error);
    }
  }

  /**
   * Assign domain-specific onboarding posts
   * UPDATE: Now all domains use user-initiated assignment - no automatic assignment
   */
  static async assignDomainOnboardingPosts(userId: string, domainId: string): Promise<void> {
    await connectToDatabase();

    try {
      // All domains now use user-initiated assignment
      // No automatic post assignment when joining a domain
      console.log(`User joined domain ${domainId} - posts will be user-initiated`);
      
      // We could still assign special system posts here if needed in the future
      // For example: welcome messages, tutorials, etc.
      
    } catch (error) {
      console.error('Error in assignDomainOnboardingPosts:', error);
    }
  }
}