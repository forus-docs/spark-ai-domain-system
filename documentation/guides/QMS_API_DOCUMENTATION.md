# QMS-Compliant API Documentation

## Overview

The Spark AI Domain System implements a Quality Management System (QMS) compliant architecture that ensures data immutability and complete audit trails through snapshot-based data flow. This document describes the API endpoints and data structures that support this architecture.

## Core Principles

### Immutable Snapshot Architecture

Data flows through the system in complete, immutable snapshots:

```
MasterTask → DomainTask → UserTask → TaskExecution
   (template)   (domain copy)  (user copy)   (execution)
```

Each level contains a COMPLETE copy of all data needed for execution, ensuring:
- ✅ Changes don't propagate automatically
- ✅ Users execute exactly what was assigned
- ✅ Complete audit trail for compliance
- ✅ No dynamic data fetching during execution

## API Endpoints

### 1. Domain Task Adoption

**POST** `/api/domains/[domainId]/adopt-task`

Adopts a MasterTask into a domain with complete data snapshot.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "masterTaskId": "string",
  "customizations": {
    "title": "string (optional)",
    "description": "string (optional)",
    "estimatedTime": "string (optional)",
    "systemPrompt": "string (optional)",
    "additionalContext": "string (optional)",
    "priority": "urgent|high|normal|low (optional)",
    "reward": {
      "amount": "number",
      "currency": "string",
      "displayText": "string"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "domainTask": {
    "id": "string",
    "title": "string",
    "description": "string",
    "taskType": "string",
    "masterTaskId": "string",
    "isQMSCompliant": true
  },
  "message": "Task successfully adopted with complete data snapshot"
}
```

**Requirements:**
- User must be domain admin
- MasterTask must exist and be active
- Task cannot already be adopted by the domain

---

**GET** `/api/domains/[domainId]/adopt-task`

Lists available MasterTasks that can be adopted by the domain.

**Response:**
```json
{
  "availableTasks": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "executionModel": "string",
      "currentStage": "string",
      "aiAgentAttached": "boolean",
      "estimatedDuration": "string",
      "complianceStandards": ["string"],
      "alreadyAdoptedByCount": "number"
    }
  ],
  "totalAvailable": "number",
  "alreadyAdopted": "number"
}
```

### 2. User Task Assignment

**POST** `/api/domain-tasks/assign`

Assigns a DomainTask to a user with complete data snapshot.

**Request Body:**
```json
{
  "taskId": "string (domainTaskId)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task assigned successfully"
}
```

**Process:**
1. Creates UserTask with complete DomainTask snapshot
2. Includes all execution data from masterTaskSnapshot
3. Marks as QMS-compliant if DomainTask has full snapshot

### 3. Task Execution

**POST** `/api/domain-tasks/[userTaskId]/task-execution`

Creates a task execution using ONLY UserTask snapshot data.

**Response:**
```json
{
  "executionId": "string",
  "isNew": "boolean",
  "masterTask": {
    "id": "string",
    "name": "string",
    "executionModel": "string",
    "aiAgentRole": "string",
    "intro": "string"
  }
}
```

**QMS Compliance:**
- NO fetching from MasterTask collection
- NO fetching from DomainTask collection
- Uses ONLY data from UserTask snapshot
- Returns error if UserTask lacks execution data

## Data Structures

### DomainTask Schema (QMS-Compliant)

```typescript
interface DomainTask {
  // Identity
  id: string;
  domain: string;
  
  // Display fields
  title: string;
  description: string;
  taskType: TaskType;
  
  // References (audit trail only)
  masterTaskId: string;
  masterTaskVersion: string;
  originalMasterTaskId: string;
  
  // QMS-COMPLIANT: Complete MasterTask snapshot
  masterTaskSnapshot: {
    name: string;
    category: string;
    executionModel: string;
    currentStage: string;
    
    // AI Configuration
    aiAgentAttached: boolean;
    aiAgentRole?: string;
    aiAgentId?: string;
    systemPrompt?: string;
    intro?: string;
    
    // Execution data
    standardOperatingProcedure?: SOP;
    contextDocuments?: ContextDocument[];
    requiredParameters?: RequiredParameter[];
    checklist?: ChecklistItem[];
    
    // Model-specific data
    formSchema?: any;
    validationRules?: any;
    workflowDefinition?: any;
    curriculum?: Curriculum[];
    
    // Metadata
    sopMetadata?: SOPMetadata;
  };
  
  // Domain customizations
  domainCustomizations?: {
    title?: string;
    description?: string;
    estimatedTime?: string;
    systemPrompt?: string;
    additionalContext?: string;
    reward?: Reward;
  };
  
  // Metadata
  adoptedAt: Date;
  adoptedBy: string;
  adoptionNotes?: string;
  isActiveInDomain: boolean;
  isQMSCompliant: boolean;
  
  // ... display and behavior fields
}
```

### UserTask Schema (QMS-Compliant)

```typescript
interface UserTask {
  // Identity
  id: string;
  userId: string;
  
  // References
  domainTaskId: string;
  masterTaskId?: string;
  
  // QMS-COMPLIANT: Complete snapshot
  taskSnapshot: {
    // All display fields
    title: string;
    description: string;
    taskType: string;
    // ... other display fields
    
    // COMPLETE execution data
    executionData?: {
      executionModel: string;
      currentStage: string;
      aiAgentAttached: boolean;
      aiAgentRole?: string;
      systemPrompt?: string;
      intro?: string;
      standardOperatingProcedure?: SOP;
      contextDocuments?: ContextDocument[];
      requiredParameters?: RequiredParameter[];
      checklist?: ChecklistItem[];
      formSchema?: any;
      validationRules?: any;
      workflowDefinition?: any;
      curriculum?: Curriculum[];
      sopMetadata?: SOPMetadata;
    };
    
    // Domain customizations applied
    domainCustomizations?: DomainCustomizations;
  };
  
  // Assignment metadata
  timestampAssigned: Date;
  assignedTo: string;
  assignedBy: string;
  assignmentReason: string;
  
  // Status
  isQMSCompliant: boolean;
  
  // ... interaction and progress fields
}
```

## Migration Guide

### Checking Compliance

To verify QMS compliance in your system:

```javascript
// Check DomainTask compliance
const isCompliant = domainTask.isQMSCompliant && 
                   domainTask.masterTaskSnapshot != null;

// Check UserTask compliance
const hasExecutionData = userTask.taskSnapshot?.executionData != null;
```

### Handling Non-Compliant Data

If a UserTask lacks execution data:
1. The task execution API will return an error
2. Admin must re-assign the task from a QMS-compliant DomainTask
3. Or run migration scripts to update existing data

## Best Practices

1. **Always verify compliance** before creating executions
2. **Never bypass** the snapshot architecture
3. **Document customizations** in the appropriate fields
4. **Maintain version tracking** for audit trails
5. **Test data flow** through all levels before production

## Error Handling

Common QMS-related errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "This task is not configured for execution" | UserTask lacks executionData | Re-assign from QMS-compliant DomainTask |
| "Master task not found" | Invalid masterTaskId reference | Verify MasterTask exists |
| "Task already adopted by this domain" | Duplicate adoption attempt | Use existing DomainTask |
| "Only domain admins can adopt tasks" | Insufficient permissions | Use admin account |

## Audit Trail

The QMS architecture provides complete audit trails:

1. **MasterTask** → Original template with version
2. **DomainTask** → Snapshot at adoption time + customizations
3. **UserTask** → Snapshot at assignment time + progress
4. **TaskExecution** → Execution using snapshot data only

Each level preserves:
- Timestamp of creation
- User who created/adopted/assigned
- Complete data snapshot
- Version information
- Customizations applied