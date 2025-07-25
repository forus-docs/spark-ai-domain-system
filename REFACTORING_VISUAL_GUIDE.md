# Visual Guide: Process→Task Refactoring

## Current Architecture (Confusing)
```
┌─────────────────┐
│   PROCESSES     │ ← "Wait, is this the library or execution?"
│  (library of    │
│  templates)     │
└────────┬────────┘
         │ adopted by domain
         ▼
┌─────────────────┐
│     POSTS       │ ← "Posts? Like social media?"
│ (domain-adopted │
│   processes)    │
└────────┬────────┘
         │ assigned to user
         ▼
┌─────────────────┐
│   USERPOSTS     │ ← "User's social posts?"
│ (user-assigned  │
│     posts)      │
└────────┬────────┘
         │ executed as
         ▼
┌─────────────────┐
│ CONVERSATIONS   │ ← "Chat about what?"
│  (execution     │
│   sessions)     │
└─────────────────┘
```

## Proposed Architecture (Clear)
```
┌─────────────────┐
│  MASTER TASKS   │ ← "Ah, the master library of all tasks!"
│   (library of   │
│  task templates │
│   with steps)   │
└────────┬────────┘
         │ adopted by domain
         ▼
┌─────────────────┐
│  DOMAIN TASKS   │ ← "Tasks this domain has adopted"
│ (domain-specific│
│  task configs)  │
└────────┬────────┘
         │ assigned to user
         ▼
┌─────────────────┐
│   USER TASKS    │ ← "Tasks assigned to me"
│ (user's assigned│
│     tasks)      │
└────────┬────────┘
         │ executed as
         ▼
┌─────────────────┐
│ TASK EXECUTIONS │ ← "My task execution sessions"
│   (execution    │
│    sessions)    │
└─────────────────┘
```

## Data Flow Example

### Current (Confusing):
```
1. Admin creates a "Process" called "Driver Onboarding"
2. Maven Hub adopts it as a "Post" 
3. User sees the "Post" and clicks it
4. System creates a "UserPost"
5. User starts a "Conversation" to execute it

Developer: "So... is it a process or a post? Why is execution a conversation?"
```

### Proposed (Clear):
```
1. Admin creates a "MasterTask" called "Driver Onboarding" with steps
2. Maven Hub adopts it as a "DomainTask"
3. User sees the "DomainTask" and clicks to assign
4. System creates a "UserTask" 
5. User starts a "TaskExecution" to complete it

Developer: "Got it! Tasks flow from master→domain→user→execution"
```

## Code Impact Visualization

### High-Impact Areas (Red)
```
/app/api/
├── posts/*                 → domain-tasks/*
├── conversations/*         → task-executions/*
└── posts/[id]/conversation → domain-tasks/[id]/execution

/lib/services/
├── postJourney.ts         → taskJourney.ts
└── conversation.service.ts → taskExecution.service.ts
```

### Medium-Impact Areas (Yellow)
```
/components/
├── post-*.tsx     → domain-task-*.tsx
├── user-post-*.tsx → user-task-*.tsx
└── process-*.tsx   → task-*.tsx

/hooks/
├── usePost.ts     → useTask.ts
└── useProcess.ts  → useMasterTask.ts
```

### Low-Impact Areas (Green)
```
/lib/db/
├── Add new collections alongside old
├── Create adapter layer
└── Maintain backward compatibility

/types/
├── Keep old types
├── Add new types extending old
└── Gradual migration
```

## Direct Fix Execution

### One-Time Rename
```
[Database Rename]
processes → masterTasks
posts → domainTasks
userposts → userTasks
conversations → taskExecutions
messages → executionMessages

[Code Update]
Find & Replace all references
Update TypeScript interfaces
Fix all imports and routes
```

### No Migration - Direct Fix
```
[Component Updates]
<PostList />        → <DomainTaskList />
<UserPostCard />    → <UserTaskCard />
<ProcessDetail />   → <TaskDetail />
```

### Immediate Benefits
```
[Clear Names]
- No more confusion
- Direct execution
- Clean codebase
```

## Benefits Visualization

### Before (Developer Confusion):
```
"Is a post a process?"
"Why do posts have conversations?"
"What's the difference between a post and userpost?"
"Where does the process fit in?"
```

### After (Developer Clarity):
```
MasterTask → DomainTask → UserTask → TaskExecution
    ↓            ↓            ↓           ↓
 Template    Adopted     Assigned    Completed
```

## Risk Matrix (Direct Fix)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Loss | Low | Project is backed up |
| API Breaking | Medium | Fix all routes at once |
| User Confusion | Low | Clear naming helps |
| Performance | None | Same indexed collections |
| Rollback Need | Low | Restore from backup if needed |

## Success Metrics

1. **Code Clarity**: New developers understand in <5 minutes
2. **Search Success**: Finding task-related code is 3x faster
3. **Bug Reduction**: Fewer naming-related bugs
4. **Onboarding**: 50% faster developer onboarding