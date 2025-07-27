import mongoose from 'mongoose';
import Domain from '../app/models/Domain';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addDomainSlugs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all domains
    const domains = await Domain.find({});
    console.log(`Found ${domains.length} domains to update`);

    // Generate and update slugs
    for (const domain of domains) {
      // Generate slug from domain name
      const slug = domain.name
        .toLowerCase()
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '')    // Remove non-alphanumeric chars except hyphens
        .replace(/--+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens

      console.log(`Updating ${domain.name} with slug: ${slug}`);
      
      // Update domain with slug
      await Domain.updateOne(
        { _id: domain._id },
        { $set: { slug } }
      );
    }

    console.log('✅ All domains updated with slugs');

    // Verify the updates
    const updatedDomains = await Domain.find({}, { name: 1, slug: 1 });
    console.log('\nUpdated domains:');
    updatedDomains.forEach(domain => {
      console.log(`  ${domain.name}: ${domain.slug}`);
    });

  } catch (error) {
    console.error('❌ Error adding domain slugs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the migration
addDomainSlugs();