# Script Analysis - DANGER Assessment

## ⚠️ DANGEROUS/OUTDATED Scripts (DELETE THESE)

### Data Manipulation Scripts (HIGH RISK)
These scripts directly modify data and could be based on old schemas:

1. **fix-master-tasks.ts** - Removes duplicates, could delete important data
2. **fix-master-task-domain-field.ts** - Modifies domain fields based on old schema
3. **final-fix-master-tasks.ts** - Removes domain field from all master tasks
4. **fix-missing-fields.ts** - Adds fields that might not be needed anymore
5. **restore-mhx-task.ts** - Restores a specific task (16KB file!) with hardcoded data
6. **fix-master-tasks-schema.js** - Old JS file, likely outdated
7. **migrate-to-unified-schema.js** - Old migration, schema has changed since

### One-time Setup Scripts (ALREADY RUN)
8. **add-domain-slugs.ts** - One-time slug addition
9. **add-user-to-maven-hub.ts** - Specific user addition
10. **adopt-tasks-for-maven-hub.ts** - One-time task adoption
11. **fix-mastertask-index-and-adopt.ts** - One-time fix

### Verification Scripts (OUTDATED)
12. **verify-master-task-fields.ts** - Based on old field requirements
13. **verify-form-alignment.ts** - Based on old form structure
14. **add-form-schema-to-identity-verification.ts** - Modifies specific task

## ✅ SAFE Scripts (KEEP THESE)

### Index Management Scripts (SAFE TO RUN)
1. **optimize-indexes.ts** - Creates performance indexes
2. **rename-indexes.ts** - Renames indexes to readable names
3. **cleanup-old-indexes.ts** - Removes auto-generated index names
4. **create-named-indexes.ts** - Creates indexes with proper names

## Recommendations

1. **DELETE all dangerous/outdated scripts** - They're based on old schemas and could damage current data
2. **KEEP only index management scripts** - These are safe and useful for maintenance
3. **UPDATE README.md** - Current README is completely outdated
4. **CREATE backup before running any script** - Always backup production data

## Safe Script Execution Order

If you need to optimize indexes:
```bash
# 1. First optimize indexes
npx tsx scripts/optimize-indexes.ts

# 2. Clean up old auto-generated names
npx tsx scripts/cleanup-old-indexes.ts

# 3. Create indexes with proper names
npx tsx scripts/create-named-indexes.ts
```

## Scripts to Delete Immediately

```bash
rm fix-master-tasks.ts
rm fix-master-task-domain-field.ts
rm final-fix-master-tasks.ts
rm fix-missing-fields.ts
rm restore-mhx-task.ts
rm fix-master-tasks-schema.js
rm migrate-to-unified-schema.js
rm add-domain-slugs.ts
rm add-user-to-maven-hub.ts
rm adopt-tasks-for-maven-hub.ts
rm fix-mastertask-index-and-adopt.ts
rm verify-master-task-fields.ts
rm verify-form-alignment.ts
rm add-form-schema-to-identity-verification.ts
```