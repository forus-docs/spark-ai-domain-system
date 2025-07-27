# Simplified Architecture Migration Guide

## Overview

We are simplifying the architecture from:
```
MasterTask → DomainTask → UserTask → TaskExecution → ExecutionMessages
```

To:
```
MasterTask → DomainTask → TaskExecution (with messages)
```

## Key Changes

### 1. Eliminated UserTask Model
- UserTask and TaskExecution have been merged into a single TaskExecution model
- TaskExecution now contains the complete task snapshot at assignment time
- Status tracking (assigned, in_progress, completed) is built into TaskExecution

### 2. Updated TaskExecution Model
```typescript
{
  // Identity
  executionId: string
  userId: ObjectId
  domainId: ObjectId
  domainTaskId: ObjectId
  
  // Complete task snapshot
  taskSnapshot: {
    title, description, taskType, executionModel, 
    procedures, formSchema, requiredParameters, etc.
  }
  
  // Execution state
  status: 'assigned' | 'in_progress' | 'completed' | 'failed'
  assignedAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Messages
  messages: ObjectId[]
}
```

### 3. API Changes

#### Assignment Flow
```
POST /api/domain-tasks/assign
Body: { taskId: domainTaskId }
Response: { executionId }
```
- Creates TaskExecution directly
- Returns executionId for immediate chat navigation
- No separate UserTask creation

#### Chat Flow
- Navigate directly to `/chat/{executionId}`
- No need for intermediate task-execution creation
- Chat messages reference TaskExecution directly

### 4. Benefits

1. **Simpler Mental Model**: One execution per task assignment
2. **Fewer Database Operations**: No intermediate UserTask lookup
3. **Clearer State Management**: Single source of truth for execution state
4. **Better Performance**: Fewer collections to query

## Migration Status

### ✅ Completed
- [x] TaskExecution model updated
- [x] ExecutionMessage model verified
- [x] Assignment API updated (/api/domain-tasks/assign)
- [x] Assigned tasks API updated (/api/tasks/assigned)
- [x] UI updated for assignment flow

### 🚧 In Progress
- [ ] Remove all UserTask references
- [ ] Update task completion flow
- [ ] Update chat streaming to use new model
- [ ] Update task display services

### ❌ Todo
- [ ] Remove legacy task services
- [ ] Update home page task display
- [ ] Update domain task adoption flow
- [ ] Clean up old API routes
- [ ] Update tests

## Files to Update/Remove

### Remove
- `/app/models/UserTask.ts` ✅
- `/app/api/domain-tasks/[taskId]/task-execution/route.ts`
- `/app/lib/services/task-assignment.service.ts`
- `/app/lib/services/task-completion.service.ts`
- `/app/lib/services/task-display.service.ts`
- `/app/lib/services/task-interaction.service.ts`

### Update
- `/app/api/chat/stream/route.ts` - Remove UserTask references
- `/app/page.tsx` - Use TaskExecutions for display
- `/app/components/chat-interface-v2.tsx` - Remove userTaskId prop
- `/app/api/task-executions/[executionId]/info/route.ts` - Use new model

## Quick Start

1. **Assign a task**: 
   ```javascript
   const { executionId } = await fetch('/api/domain-tasks/assign', {
     body: JSON.stringify({ taskId: domainTaskId })
   }).then(r => r.json())
   ```

2. **Navigate to chat**:
   ```javascript
   router.push(`/chat/${executionId}`)
   ```

3. **Fetch assigned tasks**:
   ```javascript
   const { tasks } = await fetch('/api/tasks/assigned?filter=to-me&domain=X')
     .then(r => r.json())
   // tasks[0].executionId available for navigation
   ```

## Notes

- Since we're in a blank state (only MasterTasks exist), no data migration is needed
- The architecture is now more aligned with the actual usage pattern (1 chat per assignment)
- Future enhancements (like task history) can be added without structural changes