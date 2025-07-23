#!/usr/bin/env npx tsx
import { connectToDatabase } from '../app/lib/database';
import Invite from '../app/models/Invite';

async function migrateInvites() {
  console.log('🚀 Starting Invite collection migration...');
  
  try {
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Ensure indexes are created
    await Invite.collection.createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { status: 1, expiresAt: 1 } },
      { key: { createdBy: 1 } },
      { key: { domainId: 1, roleId: 1 } }
    ]);

    console.log('✅ Indexes created for Invite collection');

    // Check collection stats
    const count = await Invite.countDocuments();
    console.log(`📊 Total invites in collection: ${count}`);

    console.log('✅ Invite migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateInvites();