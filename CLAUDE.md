# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking

# Testing single files
tsx scripts/[filename].ts  # Run individual TypeScript scripts

# Database Scripts (in package.json but many deprecated)
npm run migrate:all  # Run all database migrations
npm run seed:posts   # Seed initial posts data (deprecated)
npm run migrate:sop  # Migrate SOP structures
```

## Architecture Overview

### QMS-Compliant Data Flow
The system implements immutable snapshots for Quality Management System compliance:

```
MasterTask → DomainTask → UserTask → TaskExecution
```

Each arrow represents a COMPLETE data copy, not a reference. This ensures:
- Changes require explicit approval at each level
- Running tasks cannot change mid-execution  
- Complete audit trail for compliance

### Core Services Architecture

```
/app
  /api                          # API Routes (Next.js App Router)
    /auth                       # JWT authentication endpoints
    /domain-tasks              # Task management endpoints
    /task-executions           # Execution session management
    /chat/stream               # SSE streaming for AI chat
    /domains/[domainId]/adopt-task  # QMS-compliant task adoption
  
  /models                       # Mongoose schemas
    MasterTask.ts              # Enterprise task templates with SOPs
    DomainTask.ts              # Domain-adopted tasks (with masterTaskSnapshot)
    UserTask.ts                # User assignments (with executionData)
    TaskExecution.ts           # Active execution sessions
    
  /services                     # Business logic
    task-executions.ts         # TaskExecutionService, ExecutionMessageService
    domain-adoption.service.ts # QMS-compliant adoption logic
    
  /lib/services
    task-journey.service.ts    # User task assignment with snapshots
```

### Authentication & Session Management
- JWT tokens with access/refresh pattern
- User sessions persist across refreshes via refresh tokens
- Domain membership tracked in user.domains array
- Current domain in user.currentDomainId

### Critical Data Structures

**User Identity (Nested Structure):**
```typescript
user.identity.isVerified    // NOT user.isVerified
user.identity.verifiedAt
user.identity.verificationType
```

**Task Snapshot Architecture:**
- DomainTask contains `masterTaskSnapshot` with ALL execution data
- UserTask contains `taskSnapshot.executionData` with ALL execution fields
- TaskExecution uses ONLY UserTask snapshot data

**Reward Field Handling:**
```typescript
// In UserTask creation, reward must be plain object or null
reward: domainTask.reward ? {
  amount: domainTask.reward.amount,
  currency: domainTask.reward.currency,
  displayText: domainTask.reward.displayText
} : null
```

## Environment Configuration

Required `.env.local` variables:
```
MONGODB_URI=mongodb://localhost:27017/spark-ai
JWT_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character secret>
SESSION_SECRET=<32+ character secret>
CREDS_KEY=<32 character encryption key>
CREDS_IV=<16 character IV>
OPENAI_API_KEY=<OpenAI API key>
GEMINI_API_KEY=<Google Gemini API key>
```

## MongoDB Setup

Database: `spark-ai` on port 27017

Collections (post-refactoring):
- `users` - User accounts with nested identity
- `domains` - Domain configurations  
- `masterTasks` - Task templates with SOPs
- `domainTasks` - Domain-adopted tasks with snapshots
- `userTasks` - User assignments with execution data
- `taskExecutions` - Active execution sessions
- `executionMessages` - Chat messages

### Critical Indexes
- Remove any legacy `conversationId` indexes from taskExecutions
- UserTask has compound index on `userId` + `domainTaskId`

## API Integration Points

### Task Adoption (Domain Admin Only)
```
POST /api/domains/[domainId]/adopt-task
Body: { masterTaskId, customizations? }
```

### Task Assignment (User Self-Service)
```
POST /api/domain-tasks/assign
Body: { taskId }
```

### Task Execution (QMS-Compliant)
```
POST /api/domain-tasks/[userTaskId]/task-execution
```
Returns error if UserTask lacks executionData.

## AI Context Management

The system passes complete SOP context to AI through system prompts built from UserTask snapshots:
- Standard Operating Procedures with decision points
- Compliance requirements and regulations
- Required parameters with validation rules
- Domain-specific customizations

AI models supported:
- Gemini 1.5 Flash (default)
- GPT-4o-mini
- Claude models (future)

**Intro Message Handling:**
- Intro is injected as first ExecutionMessage in chat stream
- No popup functionality - intro appears in message history
- Created with `role: 'assistant'` and user's ID

## State Persistence Patterns

User state persists via:
1. MongoDB user document
2. JWT tokens (access + refresh)
3. localStorage for current domain/user data
4. Refresh token rotation on API calls

Task state flows through:
1. Domain adoption creates immutable DomainTask snapshot
2. User assignment creates immutable UserTask snapshot  
3. Execution uses only UserTask data (no upstream fetches)

## Critical Implementation Notes

1. **No Dynamic Fetching**: TaskExecutions must NEVER fetch from MasterTask/DomainTask
2. **Snapshot Completeness**: Each level must copy ALL data needed for execution
3. **User Verification**: Always check `user.identity.isVerified` (nested structure)
4. **QMS Compliance**: New tasks require `isQMSCompliant: true` flag
5. **Error Handling**: Non-compliant UserTasks return "not configured for execution" error
6. **Domain IDs**: Use ObjectID, not string identifiers for domains
7. **Execution Model**: All MasterTasks currently use `executionModel: 'sop'`
8. **No currentStage**: This field was removed - not persisted in the application

## Common Pitfalls & Solutions

### Mongoose Document vs Plain Object
When copying data between collections, convert Mongoose subdocuments to plain objects:
```typescript
// Wrong - causes "Cast to Embedded failed" errors
reward: domainTask.reward

// Correct
reward: domainTask.reward ? {
  amount: domainTask.reward.amount,
  currency: domainTask.reward.currency,
  displayText: domainTask.reward.displayText
} : null
```

### Task Click Flow
1. User clicks unassigned task → assign it first
2. User clicks assigned task → create TaskExecution
3. TaskExecution creation → inject intro as first message
4. Navigate to `/chat/[executionId]`

### MongoDB MCP Integration
- Configured in `~/.claude/.mcp.json`
- Tools available with prefix `mcp__mongodb__`
- Use for direct database queries and updates