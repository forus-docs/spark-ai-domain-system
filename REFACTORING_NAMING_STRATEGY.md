  # Database and Code Refactoring Strategy: Process → Task Naming

## Current vs Proposed Naming

### Database Collections
| Current Name | Proposed Name | Conceptual Purpose |
|--------------|---------------|-------------------|
| `processes` | `masterTasks` | Library of all available task templates with steps |
| `posts` | `domainTasks` | Tasks adopted by a domain from masterTasks |
| `userposts` | `userTasks` | Tasks assigned to users from domainTasks |
| `conversations` | `taskExecutions` | Execution sessions for userTasks |
| `messages` | `executionMessages` | Messages within taskExecutions |

### Conceptual Model Alignment

**Current Model (Confusing)**:
```
Process (library) → Post (domain adoption) → UserPost (user assignment)
```

**Proposed Model (Clear)**:
```
MasterTask (library) → DomainTask (domain adoption) → UserTask (user assignment)
```

## Refactoring Approach - DIRECT FIX

### Direct Rename Approach (NOT A MIGRATION)
**Project is backed up. Execute direct renaming:**

```javascript
// Direct MongoDB collection renames
db.processes.renameCollection('masterTasks');
db.posts.renameCollection('domainTasks');
db.userposts.renameCollection('userTasks');
db.conversations.renameCollection('taskExecutions');
db.messages.renameCollection('executionMessages');
```

### Code Updates Required
Update all references in code to use new names:

```typescript
// lib/db/adapters/naming-adapter.ts
export const CollectionNames = {
  // Legacy names
  PROCESSES: 'processes',
  POSTS: 'posts',
  USER_POSTS: 'userposts',
  
  // New names
  MASTER_TASKS: 'masterTasks',
  DOMAIN_TASKS: 'domainTasks',
  USER_TASKS: 'userTasks',
  
  // Adapter methods
  getMasterCollection: () => process.env.USE_NEW_NAMING ? 'masterTasks' : 'processes',
  getDomainCollection: () => process.env.USE_NEW_NAMING ? 'domainTasks' : 'posts',
  getUserCollection: () => process.env.USE_NEW_NAMING ? 'userTasks' : 'userposts',
};
```

### Phase 3: Interface/Type Definitions
Create new interfaces alongside existing ones:

```typescript
// Current
interface Post { ... }
interface UserPost { ... }
interface Process { ... }

// New (extends current for compatibility)
interface MasterTask extends Process {
  steps: TaskStep[];
}

interface DomainTask extends Post {
  masterTaskId: string;
  domainCustomizations?: object;
}

interface UserTask extends UserPost {
  domainTaskId: string;
  taskProgress: TaskProgress;
}
```

## Code Touchpoints Analysis

### API Routes to Update
1. `/api/posts/*` → `/api/domain-tasks/*`
2. `/api/posts/[postId]/conversation` → `/api/domain-tasks/[taskId]/execution`
3. `/api/conversations/*` → `/api/task-executions/*`

### Service Layer Files
1. `lib/services/postJourney.ts` → `lib/services/taskJourney.ts`
2. `lib/services/conversation.service.ts` → `lib/services/taskExecution.service.ts`
3. `lib/db/post-journey/*` → `lib/db/task-journey/*`

### React Components
1. `components/post-list.tsx` → `components/domain-task-list.tsx`
2. `components/user-post-card.tsx` → `components/user-task-card.tsx`
3. `app/(authenticated)/process/[processId]` → `app/(authenticated)/task/[taskId]`

### Context Updates
1. `PostContext` → `TaskContext`
2. `usePost` → `useTask` hooks
3. `selectedPost` → `selectedTask` state variables

## Direct Fix Execution

### Step 1: Rename MongoDB Collections
```bash
# Run these commands in MongoDB shell
use spark-ai
db.processes.renameCollection('masterTasks')
db.posts.renameCollection('domainTasks')
db.userposts.renameCollection('userTasks')
db.conversations.renameCollection('taskExecutions')
db.messages.renameCollection('executionMessages')
```

### Step 2: Update All Code References
- Find and replace all collection names
- Update TypeScript interfaces
- Fix import statements
- Update API routes

### Step 3: Test Application
- Run the application
- Verify all features work
- Check that data flows correctly

## Benefits of Refactoring

1. **Clarity**: "Task" immediately conveys work to be done
2. **Hierarchy**: Master → Domain → User is intuitive
3. **Consistency**: All levels use "Task" terminology
4. **Searchability**: Easier to find related code
5. **Onboarding**: New developers understand faster

## Technical Debt Items

### Current Issues
1. **Naming Confusion**: "Post" suggests social media content
2. **Process vs Post**: Unclear relationship
3. **Version Management**: No clear upgrade path for tasks

### Future Enhancements (Post-Refactoring)
1. **Task Versioning**: Allow domains to upgrade to new masterTask versions
2. **Task Migration**: Let users upgrade to new task versions
3. **Task Templates**: Better template inheritance system
4. **Task Analytics**: Track task completion across versions

## Risk Mitigation

1. **Parallel Running**: Both naming schemes work simultaneously
2. **Automated Testing**: Comprehensive test suite for both paths
3. **Rollback Plan**: Feature flag allows instant rollback
4. **Data Integrity**: All operations maintain ACID properties
5. **Zero Downtime**: Migrations run without service interruption

## Implementation Checklist

- [ ] Create migration scripts
- [ ] Implement naming adapter
- [ ] Add feature flags
- [ ] Update TypeScript interfaces
- [ ] Create parallel API routes
- [ ] Update service layer
- [ ] Migrate React components
- [ ] Update documentation
- [ ] Test both naming paths
- [ ] Plan rollout schedule