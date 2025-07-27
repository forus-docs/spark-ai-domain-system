# Task Schema Audit Report

## Executive Summary

The current task system has three separate schemas (MasterTask, DomainTask, UserTask) with complex inheritance and snapshotting logic. This creates unnecessary complexity when a simple copy mechanism would suffice.

## Current Database Analysis

### MasterTask Collection
**Documents Found**: 2
**Key Fields**:
- Basic: `_id`, `name`, `description`, `category`
- Execution: `executionModel`, `currentStage`, `aiAgentAttached`, `aiAgentRole`
- Content: `systemPrompt`, `intro`, `checklist`, `standardOperatingProcedure`, `requiredParameters`
- Metadata: `sopMetadata`, `masterTaskId`, `active`, `createdAt`, `updatedAt`
- Tracking: `adoptedByDomains`, `globalMetrics`
- AI-specific: `standardizationGoals`, `potentialAIValue`, `aiImprovements`
- Other: `contextDocuments`, `curriculum`

### DomainTask Collection
**Documents Found**: 0 (empty collection)
**Expected Fields** (from schema):
- All MasterTask fields (as snapshot)
- `domain` - Domain ID reference
- Domain-specific customizations
- Adoption metadata

### UserTask Collection
**Documents Found**: 1
**Key Fields**:
- References: `userId`, `domainTaskId`, `masterTaskId`
- Assignment: `assignedTo`, `assignedBy`, `assignmentReason`, `timestampAssigned`
- Status: `isHidden`, `isCompleted`, `viewCount`, `progress`
- Content: `taskSnapshot` (contains all task data)
- Metadata: `isQMSCompliant`, `createdAt`, `updatedAt`

## Schema Analysis from Code

### MasterTask Schema Fields
From `/app/models/MasterTask.ts`:
1. Core identification
2. Execution configuration
3. SOP and procedures
4. UI/UX fields (missing in DB but needed)
5. Domain adoption tracking

### DomainTask Schema Fields
From `/app/models/DomainTask.ts`:
1. `domain` (required) - Domain reference
2. `masterTaskSnapshot` - Complete copy of MasterTask
3. `domainCustomizations` - Overlays
4. Adoption metadata
5. Display configuration (iconType, colorScheme, etc.)
6. Status flags

### UserTask Schema Fields
From `/app/models/UserTask.ts`:
1. User references
2. `taskSnapshot` - Complete copy with executionData
3. Assignment tracking
4. Progress tracking
5. Completion status

## Key Findings

### 1. Redundant Complexity
- Each level stores a complete snapshot of the previous level
- Complex validation rules enforce snapshot completeness
- No actual benefit from this complexity

### 2. Missing Fields in MasterTask
Fields that exist in DomainTask/UserTask but not MasterTask:
- `domain` (only needed for DomainTask)
- `assignedTo`, `assignedBy` (only needed for UserTask)
- `progress`, `isCompleted` (only needed for UserTask)
- Display fields: `iconType`, `colorScheme`, `ctaText`, `ctaAction`
- Task metadata: `taskType`, `priority`, `estimatedTime`, `reward`

### 3. Unnecessary Fields
- `adoptedByDomains` in MasterTask (can be derived)
- `globalMetrics` in MasterTask (can be aggregated)
- Complex snapshot structures

## Recommended Unified Schema

```typescript
interface UnifiedTask {
  // Core Fields (used by all)
  _id: string;
  title: string;
  description: string;
  category: string;
  taskType: string;
  priority: string;
  estimatedTime: string;
  
  // Display Configuration (used by all)
  iconType: string;
  colorScheme: string;
  ctaText: string;
  ctaAction: object;
  imageUrl?: string;
  
  // Execution Configuration (used by all)
  executionModel: string;
  aiAgentAttached: boolean;
  aiAgentRole: string;
  systemPrompt: string;
  intro: string;
  
  // Content (used by all)
  standardOperatingProcedure: object;
  requiredParameters: array;
  checklist: array;
  sopMetadata: object;
  
  // Status (context-dependent)
  active: boolean;
  isCompleted?: boolean;
  isHidden?: boolean;
  
  // References (context-dependent)
  masterTaskId?: string;  // For DomainTask/UserTask
  domain?: string;        // For DomainTask/UserTask
  domainTaskId?: string;  // For UserTask
  userId?: string;        // For UserTask
  
  // Assignment (UserTask only)
  assignedTo?: string;
  assignedBy?: string;
  assignmentReason?: string;
  timestampAssigned?: Date;
  
  // Progress (UserTask only)
  progress?: object;
  viewCount?: number;
  
  // Metadata
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional Fields
  reward?: object;
  prerequisiteTasks?: array;
  nextTasks?: array;
  contextDocuments?: array;
  curriculum?: array;
}
```

## Migration Strategy

1. **Add missing fields to MasterTask schema**:
   - Display fields (iconType, colorScheme, etc.)
   - Task metadata (taskType, priority, etc.)
   - Make domain-specific fields optional

2. **Simplify copy operations**:
   - Domain adoption: `const domainTask = { ...masterTask, domain: domainId }`
   - User assignment: `const userTask = { ...domainTask, userId, assignedTo, assignedBy }`

3. **Remove complex validation**:
   - No need for snapshot validation
   - No need for nested data structures
   - Simple field copying

## Benefits

1. **Simplicity**: One schema to maintain
2. **Flexibility**: Easy to add fields
3. **Performance**: No complex validation
4. **Clarity**: Clear what fields are used where
5. **Maintainability**: Less code, fewer bugs