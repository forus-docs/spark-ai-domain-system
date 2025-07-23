import mongoose from 'mongoose';
import { connectToDatabase } from '../app/lib/database';
import UserPost from '../app/models/UserPost';
import Post from '../app/models/Post';

/**
 * Migration script to update existing UserPosts with complete snapshot data
 * This ensures all UserPosts have the full snapshot of their master post
 * at the time of assignment, making them immutable to master post changes
 */
async function migrateUserPostSnapshots() {
  console.log('Starting UserPost snapshot migration...');
  
  try {
    await connectToDatabase();
    
    // Get all UserPosts
    const userPosts = await UserPost.find({});
    console.log(`Found ${userPosts.length} UserPosts to migrate`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const userPost of userPosts) {
      try {
        // Get the master post
        const masterPost = await Post.findById(userPost.postId);
        
        if (!masterPost) {
          console.warn(`Master post not found for UserPost ${userPost._id} (postId: ${userPost.postId})`);
          errorCount++;
          continue;
        }
        
        // Check if snapshot already has all fields (check for a field that wasn't in the old schema)
        if (userPost.postSnapshot && 'postType' in userPost.postSnapshot) {
          console.log(`UserPost ${userPost._id} already has complete snapshot, skipping`);
          continue;
        }
        
        // Update the snapshot with all fields
        const completeSnapshot = {
          // Core content fields
          title: userPost.postSnapshot?.title || masterPost.title,
          description: userPost.postSnapshot?.description || masterPost.description,
          imageUrl: userPost.postSnapshot?.imageUrl || masterPost.imageUrl,
          version: userPost.postSnapshot?.version || masterPost.version,
          
          // Visual styling
          iconType: masterPost.iconType,
          colorScheme: masterPost.colorScheme,
          
          // CTA configuration
          ctaText: userPost.postSnapshot?.ctaText || masterPost.ctaText,
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
        };
        
        // Update the UserPost
        await UserPost.findByIdAndUpdate(userPost._id, {
          postSnapshot: completeSnapshot
        });
        
        updatedCount++;
        console.log(`Updated UserPost ${userPost._id} with complete snapshot`);
      } catch (error) {
        console.error(`Error updating UserPost ${userPost._id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Updated: ${updatedCount} UserPosts`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
migrateUserPostSnapshots().catch(console.error);