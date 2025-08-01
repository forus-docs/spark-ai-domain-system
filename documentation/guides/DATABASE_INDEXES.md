# Database Index Naming Convention

## Overview

All MongoDB indexes in the Spark AI application follow a consistent naming convention for better maintainability and debugging.

## Naming Pattern

All index names start with `idx_` followed by a descriptive name that indicates the index's purpose.

### Common Patterns

1. **Single Field Index**: `idx_<field_name>`
   - Example: `idx_domain`, `idx_user`, `idx_active`

2. **Compound Index**: `idx_<primary_field>_<secondary_field>`
   - Example: `idx_user_recent`, `idx_domain_active`

3. **Purpose-Based Index**: `idx_<purpose>`
   - Example: `idx_text_search`, `idx_active_invites`

4. **Unique Constraint Index**: `idx_<fields>_unique`
   - Example: `idx_user_domain_unique`

## Index Categories

### User Queries
- `idx_user` - Find by user ID
- `idx_user_recent` - Recent items by user
- `idx_user_status` - User items by status
- `idx_user_completed` - Completed tasks by user
- `idx_user_domains` - Find users by domain membership
- `idx_verified` - Find verified users

### Domain Queries
- `idx_domain` - Find by domain
- `idx_domain_active` - Active items in domain
- `idx_domain_active_priority` - Prioritized active items
- `idx_domain_user` - Domain-user relationships
- `idx_domain_type_active` - Domain items by type

### Task/Execution Queries
- `idx_execution_id` - Find by execution ID
- `idx_execution_time` - Messages in chronological order
- `idx_execution_role` - Messages by role (user/assistant)
- `idx_domain_task` - Find by domain task reference
- `idx_master_task` - Find by master task reference

### Time-Based Queries
- `idx_user_recent` - Recent items by user
- `idx_assigned_to_time` - Tasks by assignee and time
- `idx_assigned_by_time` - Tasks by assigner and time

### Text Search
- `idx_text_search` - Full-text search on name/description fields

### Relationship Queries
- `idx_parent_message` - Find child messages
- `idx_adopted_domains` - Find adopted domain tasks
- `idx_creator` - Find by creator

## Implementation Example

```javascript
// In Mongoose schema definition
TaskExecutionSchema.index(
  { userId: 1, createdAt: -1 }, 
  { name: 'idx_user_recent' }
);

// Compound index with sorting
MasterTaskSchema.index(
  { domain: 1, isActive: 1, priority: -1 }, 
  { name: 'idx_domain_active_priority' }
);

// Text search index
DomainSchema.index(
  { name: 'text', description: 'text' }, 
  { name: 'idx_text_search' }
);

// Unique constraint
UserSchema.index(
  { '_id': 1, 'domains.domainId': 1 }, 
  { unique: true, name: 'idx_user_domain_unique' }
);
```

## Benefits

1. **Clarity**: Index names immediately indicate their purpose
2. **Debugging**: Easier to identify slow queries and missing indexes
3. **Maintenance**: Clear which indexes can be dropped or modified
4. **Monitoring**: Better index usage statistics and performance tracking
5. **Documentation**: Self-documenting index structure

## Index Management Scripts

- `scripts/optimize-indexes.ts` - Creates optimized indexes
- `scripts/rename-indexes.ts` - Renames existing indexes
- `scripts/cleanup-old-indexes.ts` - Removes auto-generated index names

## Best Practices

1. Always specify explicit index names in schema definitions
2. Keep names concise but descriptive
3. Use consistent field order in compound indexes (most selective first)
4. Document the query pattern each index supports
5. Regularly review index usage with MongoDB's index statistics