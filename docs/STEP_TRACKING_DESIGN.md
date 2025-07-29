# Step-Level Status Tracking Design Document

## Overview

This document outlines the design for implementing step-level status tracking in the Spark AI Domain System. The goal is to provide users with clear progress indicators and dynamic UI elements that adapt based on the current step in a task's procedure.

## Current State

### Existing Infrastructure
- **TaskExecution Model**: Already has `procedureStates: Record<number, 'todo' | 'in_progress' | 'done'>` field
- **MasterTask Model**: Has detailed `procedures` array with step information
- **Chat Interface**: Already supports dynamic UI elements (forms, file uploads, structured data display)
- **AI Integration**: Can send and receive structured JSON data

### Gaps
- No visual step indicator in the chat interface
- `procedureStates` field exists but is not being utilized
- No standardized protocol for AI to communicate step progress
- No automatic UI adaptation based on current step

## Design Goals

1. **Visibility**: Users should always know which step they're on
2. **Simplicity**: Minimal changes to existing architecture
3. **Flexibility**: Support different types of steps (forms, uploads, reviews)
4. **Extensibility**: Easy to add new step types in the future

## Technical Design

### 1. Data Model (No Changes Required)

The existing models already support what we need:

```typescript
// MasterTask - procedures array
procedures: Array<{
  stepNumber: number;
  name: string;
  description: string;
  responsible: string;
  // ... other fields
}>

// TaskExecution - tracking states
procedureStates?: Record<number, 'todo' | 'in_progress' | 'done'>;
```

### 2. AI Communication Protocol

The AI will send structured updates embedded in its responses:

```json
{
  "type": "step_update",
  "stepNumber": 3,
  "status": "in_progress" | "completed",
  "action": "document_upload" | "form_fill" | "review" | "approval",
  "data": {
    // Optional step-specific data
  }
}
```

### 3. UI Components

#### Step Indicator Component
```typescript
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  procedures: Array<Procedure>;
  procedureStates: Record<number, string>;
}
```

Visual representation:
```
Step 3 of 7: Upload Identity Document
[=====>     ] 43% Complete
```

#### Dynamic Step Content
Based on the `action` field in step updates:
- `document_upload` → FileUploadSimple component
- `form_fill` → FormMessage component  
- `review` → StructuredDataDisplay component
- `approval` → Custom approval buttons

### 4. Integration Flow

1. **AI sends step update** → Embedded in chat message
2. **SmartMessageDisplay extracts** → Parses JSON structure
3. **Chat interface updates** → Updates procedureStates via API
4. **UI reflects change** → Step indicator updates, appropriate UI shows

## Implementation Phases

### Phase 1: Basic Infrastructure (Week 1)
- [ ] Add step update handling to SmartMessageDisplay
- [ ] Create StepIndicator component
- [ ] Add API endpoint to update procedureStates

### Phase 2: UI Integration (Week 2)
- [ ] Integrate StepIndicator into chat interface
- [ ] Add dynamic UI switching based on step action
- [ ] Update existing components to work with step context

### Phase 3: AI Training (Week 3)
- [ ] Update system prompts to include step update protocol
- [ ] Test with different task types
- [ ] Refine based on testing

## Example User Flow

1. User starts "Identity Verification" task
2. AI: "Let's begin with Step 1: Personal Information" + `{"type": "step_update", "stepNumber": 1, "status": "in_progress", "action": "form_fill"}`
3. UI shows: Step indicator "1 of 5" and form fields
4. User completes form
5. AI: "Great! Moving to Step 2: Document Upload" + `{"type": "step_update", "stepNumber": 1, "status": "completed"}` + `{"type": "step_update", "stepNumber": 2, "status": "in_progress", "action": "document_upload"}`
6. UI updates: Step indicator "2 of 5" and file upload interface

## Benefits

1. **User Experience**: Clear progress tracking reduces anxiety and confusion
2. **Compliance**: Step-by-step tracking supports QMS requirements
3. **Flexibility**: Different UI for different step types improves usability
4. **Auditability**: Complete record of who completed which steps when

## Future Enhancements

After initial implementation and testing:
- Error handling and step retry mechanisms
- Skip functionality for optional steps
- Step dependencies and conditional flows
- Time tracking per step
- Role-based step assignments

## Success Metrics

- User task completion rate improvement
- Reduction in support queries about task progress
- Average time to complete multi-step tasks
- User satisfaction scores

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| AI doesn't send proper updates | Fallback to manual progress tracking |
| Complex procedures overwhelm users | Start with simple 3-5 step procedures |
| Performance impact of frequent updates | Batch updates, use existing SSE infrastructure |

## Conclusion

This design provides a minimal yet effective approach to step tracking that leverages existing infrastructure while providing clear value to users. The phased implementation allows for testing and refinement without major architectural changes.