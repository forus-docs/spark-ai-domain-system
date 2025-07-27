# Database Maintenance Scripts

This directory contains safe database maintenance scripts for the Spark AI Domain System.

## ⚠️ WARNING

Only the scripts currently in this directory are safe to run. Any other scripts have been removed because they were outdated and could damage the database.

## Available Scripts

### Index Management

These scripts manage MongoDB indexes for optimal query performance:

1. **optimize-indexes.ts**
   - Creates performance-optimized indexes based on common query patterns
   - Removes unnecessary indexes that slow down writes
   - Safe to run multiple times

2. **cleanup-old-indexes.ts**
   - Removes indexes with auto-generated names (like `userId_1_createdAt_-1`)
   - Prepares for creating properly named indexes
   - Run this before `create-named-indexes.ts`

3. **create-named-indexes.ts**
   - Creates all indexes with human-readable names (like `idx_user_recent`)
   - Follows the naming convention documented in `/docs/database-indexes.md`
   - Safe to run multiple times

4. **rename-indexes.ts**
   - Attempts to rename existing indexes (backup approach)
   - Usually better to use cleanup + create approach

## Usage

### Prerequisites

1. **MongoDB must be running** on port 27017
2. **Environment variables** must be configured in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/spark-ai
   ```

### Running Index Optimization

Run these scripts in order for best results:

```bash
# 1. First optimize indexes (creates/removes based on usage patterns)
npx tsx scripts/optimize-indexes.ts

# 2. Clean up old auto-generated index names
npx tsx scripts/cleanup-old-indexes.ts

# 3. Create all indexes with proper readable names
npx tsx scripts/create-named-indexes.ts
```

### Verifying Indexes

After running the scripts, you can verify indexes using MongoDB MCP tools in Claude Code or MongoDB Compass.

Expected index names follow this pattern:
- `idx_user_recent` - Recent items by user
- `idx_domain_active` - Active items in domain
- `idx_text_search` - Full-text search indexes
- etc.

## Index Naming Convention

All indexes follow the pattern: `idx_<purpose>` where purpose describes what the index optimizes.

See `/docs/database-indexes.md` for the complete naming convention documentation.

## Safety Notes

1. **Always backup your database** before running maintenance scripts in production
2. These scripts are idempotent - safe to run multiple times
3. Scripts will skip creating indexes that already exist
4. Scripts run indexes in background mode to avoid blocking operations

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
lsof -i :27017

# Start MongoDB if needed
mongod --dbpath ~/data/db --port 27017 &
```

### Script Errors
- **"Index already exists"** - This is normal, script skips existing indexes
- **"Collection not found"** - Some collections may not exist yet, this is safe
- **Connection errors** - Check MongoDB is running and MONGODB_URI is correct