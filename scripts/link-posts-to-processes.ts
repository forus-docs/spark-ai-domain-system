import mongoose from 'mongoose';
import { connectToDatabase } from '../app/lib/database';

// Mapping of post ctaAction.target values to process IDs
const postToProcessMapping: Record<string, string> = {
  // Identity verification
  'identity-verification': 'identity-verification',
  
  // Profile/Onboarding processes
  'investor-profile': 'profile-creation',
  'membership-application': 'registration-process',
  'vehicle-registration': 'registration-process',
  'savings-goal': 'financial-planning',
  
  // Analysis processes
  'investment-review': 'investment-analysis',
  
  // Compliance processes
  'safety-compliance': 'compliance-verification',
  
  // Training processes (these posts have navigate actions, not process actions)
  // 'investment-fundamentals': 'training', // This is a navigate action, not process
};

async function linkPostsToProcesses() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Get all posts
    const posts = await mongoose.connection.db.collection('posts').find({}).toArray();
    console.log(`Found ${posts.length} posts to process`);

    // Get all processes for validation
    const processes = await mongoose.connection.db.collection('processes').find({}).toArray();
    const processIds = new Set(processes.map(p => p.processId));
    console.log(`Found ${processes.length} processes in database`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      // Only process posts with ctaAction.type === 'process'
      if (post.ctaAction?.type !== 'process') {
        console.log(`Skipping post "${post.title}" - action type: ${post.ctaAction?.type}`);
        skippedCount++;
        continue;
      }

      const target = post.ctaAction.target;
      const processId = postToProcessMapping[target];

      if (!processId) {
        console.warn(`No process mapping found for post "${post.title}" with target: ${target}`);
        continue;
      }

      if (!processIds.has(processId)) {
        console.warn(`Process ID "${processId}" not found in database for post "${post.title}"`);
        continue;
      }

      // Update the post with the process ID
      const result = await mongoose.connection.db.collection('posts').updateOne(
        { _id: post._id },
        { $set: { processId: processId } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Updated post "${post.title}" with processId: ${processId}`);
        updatedCount++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total posts: ${posts.length}`);
    console.log(`Posts with non-process actions: ${skippedCount}`);
    console.log(`Posts updated with process IDs: ${updatedCount}`);

    // Show posts that have process actions but weren't mapped
    const unmappedPosts = posts.filter(p => 
      p.ctaAction?.type === 'process' && 
      !postToProcessMapping[p.ctaAction.target]
    );

    if (unmappedPosts.length > 0) {
      console.log('\n--- Posts with process actions but no mapping ---');
      unmappedPosts.forEach(p => {
        console.log(`- "${p.title}" (target: ${p.ctaAction.target})`);
      });
    }

    // Verify the updates
    const updatedPosts = await mongoose.connection.db.collection('posts')
      .find({ processId: { $exists: true } })
      .toArray();
    
    console.log(`\n--- Verification ---`);
    console.log(`Posts with processId set: ${updatedPosts.length}`);
    
    updatedPosts.forEach(p => {
      console.log(`- "${p.title}" → processId: ${p.processId}`);
    });

  } catch (error) {
    console.error('Error linking posts to processes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
linkPostsToProcesses().catch(console.error);