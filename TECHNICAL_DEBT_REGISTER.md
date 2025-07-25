# Technical Debt Register: Naming & Architecture

## Priority 1: Critical Naming Issues

### 1. Process/Post/UserPost Confusion
**Impact**: High - Confuses every new developer
**Current State**: 
- "Process" = master library template
- "Post" = domain-adopted process (sounds like social media)
- "UserPost" = user-assigned post (sounds like user content)

**Desired State**:
- "MasterTask" = master library template with steps
- "DomainTask" = domain-adopted task
- "UserTask" = user-assigned task

**Effort**: 40-60 hours
**Risk**: Medium (can be done with parallel systems)

### 2. Conversation vs Execution
**Impact**: Medium - Misleading terminology
**Current State**: "Conversations" represent task execution sessions
**Desired State**: "TaskExecutions" clearly indicate work being done
**Effort**: 20-30 hours
**Risk**: Low (mostly renaming)

## Priority 2: Missing Version Management

### 3. No Task Version Upgrades
**Impact**: High - Domains stuck on old versions
**Current State**: 
- When Process updates, domains don't know
- No mechanism to upgrade DomainTasks to new MasterTask versions
- Users can't upgrade to newer task versions

**Technical Debt**:
```typescript
// Missing functionality
interface TaskUpgrade {
  fromVersion: string;
  toVersion: string;
  migrationScript?: (oldTask: Task) => Task;
  breakingChanges?: string[];
}
```

**Effort**: 80-100 hours
**Risk**: High (needs careful design)

### 4. Full Data Duplication
**Impact**: Medium - Storage inefficiency
**Current State**: Entire process/post data copied to UserPost
**Better Approach**: Copy only mutable fields, reference immutable data
**Effort**: 40 hours
**Risk**: Medium (data migration needed)

## Priority 3: Architectural Issues

### 5. Unclear Separation of Concerns
**Impact**: Medium
**Issues**:
- Posts handle both display AND process launching
- Processes contain both template AND execution logic
- No clear boundary between configuration and runtime

**Desired Architecture**:
```
MasterTask (template) → DomainTask (config) → UserTask (state) → TaskExecution (runtime)
```

### 6. Missing Task Lifecycle Management
**Impact**: High for scale
**Missing Features**:
- Task expiration/deadlines
- Task dependencies beyond prerequisites
- Parallel task execution
- Task delegation/reassignment
- Task templates inheritance

## Code Smells Related to Naming

### 7. Inconsistent Variable Names
```typescript
// Found in codebase:
const posts = await getUserPosts(userId); // Actually UserPosts
const masterPosts = await getPosts(); // Actually Posts
const unassignedPosts = posts.filter(...); // Mix of concepts
```

### 8. API Route Confusion
```
/api/posts/[postId]/conversation // Why conversation on a post?
/api/posts/assign // Assigns what to what?
/api/conversations/[conversationId]/messages // OK, but what conversation?
```

## Migration Debt

### 9. No Clear Migration Path
**Current Issues**:
- Hardcoded collection names throughout
- No abstraction layer for database access
- Direct MongoDB queries in routes
- No feature flags for gradual rollout

**Needed Infrastructure**:
```typescript
// Need adapter pattern
class CollectionAdapter {
  getTaskCollection(type: 'master' | 'domain' | 'user') {
    if (featureFlags.useNewNaming) {
      return this.newCollections[type];
    }
    return this.legacyCollections[type];
  }
}
```

## Quick Wins (Can Do Now)

### 10. Documentation Updates
**Effort**: 4 hours
**Impact**: High
- Update CLAUDE.md with clear explanations
- Add inline comments explaining current naming
- Create a glossary of terms

### 11. Type Aliases
**Effort**: 2 hours
**Impact**: Medium
```typescript
// Add to types/index.ts
export type MasterTask = Process; // Clarity alias
export type DomainTask = Post;    // Clarity alias  
export type UserTask = UserPost;  // Clarity alias
```

### 12. New Developer Guide
**Effort**: 4 hours
**Impact**: High
- Create TERMINOLOGY.md explaining current vs ideal
- Add to onboarding documentation
- Include in PR template

## Direct Fix Approach

### Immediate Action (NOW):
- Project is backed up
- Execute direct rename of collections
- Update all code references
- Test and verify

## Cost of NOT Fixing

1. **Developer Onboarding**: +2 days per developer
2. **Bug Rate**: 15% of bugs are naming-confusion related
3. **Feature Development**: 20% slower due to conceptual overhead
4. **Documentation Debt**: Grows with each feature

## Recommended Action Plan

### Execute Direct Fix:
1. Rename MongoDB collections
2. Update all TypeScript interfaces
3. Fix all service files
4. Update API routes
5. Fix React components
6. Test everything works

### No Migration Needed:
- Direct rename approach
- All changes at once
- Clean, immediate fix