import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function cleanupOldIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collInfo of collections) {
      const collectionName = collInfo.name;
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      
      console.log(`\n=== ${collectionName} ===`);
      
      for (const index of indexes) {
        // Skip _id index and indexes that already have good names
        if (index.name === '_id_' || index.name.startsWith('idx_')) {
          continue;
        }
        
        // Drop indexes with auto-generated names
        if (index.name.includes('_1') || index.name.includes('_-1') || index.name.includes('_text')) {
          console.log(`Dropping old index: ${index.name}`);
          try {
            await collection.dropIndex(index.name);
            console.log(`  ✓ Dropped`);
          } catch (err: any) {
            console.error(`  ✗ Error: ${err.message}`);
          }
        }
      }
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
cleanupOldIndexes();