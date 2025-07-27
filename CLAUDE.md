# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm install          # Install dependencies (including local @forus/ui package)
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking

# Database Setup
mongod --dbpath ~/data/db --port 27017 &  # Start MongoDB if not running
npm run migrate:all  # Run all database migrations

# Database Scripts
npm run seed:posts   # Seed initial posts data
npm run migrate:sop  # Migrate SOP structures
node scripts/migrate-to-qms-compliant.js     # Create QMS-compliant tasks
node scripts/cleanup-non-compliant-tasks.js  # Remove old non-compliant data
node scripts/investigate-data-flow.js        # Analyze data compliance

# Run any TypeScript script
tsx scripts/[filename].ts  # Execute any script in scripts directory
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

**Important**: TaskExecutions only track the immediate source (DomainTask), not MasterTask, since all data is available in the UserTask snapshot.

### Core Services Architecture

```
/app
  /api                          # API Routes (Next.js 14 App Router)
    /auth                       # JWT authentication endpoints
    /domain-tasks              # Task management endpoints
    /task-executions           # Execution session management
    /chat/stream               # SSE streaming for AI chat
    /domains/[domainId]/
      /adopt-task              # QMS-compliant task adoption
      /master-tasks/[id]       # Domain-scoped master task access
  
  /models                       # Mongoose schemas
    MasterTask.ts              # Enterprise task templates with SOPs
    DomainTask.ts              # Domain-adopted tasks (with masterTaskSnapshot)
    UserTask.ts                # User assignments (with executionData)
    TaskExecution.ts           # Active execution sessions (no masterTask fields)
    ExecutionMessage.ts        # Chat messages within executions
    
  /services                     # Business logic
    task-executions.ts         # TaskExecutionService, ExecutionMessageService
    domain-adoption.service.ts # QMS-compliant adoption logic
    
  /lib/services                # Refactored services (facade pattern)
    task-journey.service.ts    # Facade for task operations
    task-assignment.service.ts # Task assignment logic
    task-completion.service.ts # Task completion logic
    task-display.service.ts    # Task display formatting
    task-interaction.service.ts # Task interaction operations
    
  /lib/auth
    jwt.ts                     # JWT token management
    domain-access.ts           # Domain membership verification
    
  /contexts                     # React Context providers
    auth-context.tsx           # JWT auth management
    domain-context.tsx         # Domain selection state
    chat-context.tsx          # Chat session management
    file-context.tsx          # File upload handling
```

### Request Flow Architecture

1. **Client Request** → Next.js App Router → API Route Handler
2. **API Route** → JWT Verification → Domain Access Check → Service Layer
3. **Service Layer** → Mongoose Models → MongoDB
4. **Response** → Transform → Client

### Authentication & Security

#### JWT Token Management
- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry (httpOnly cookie)
- Token rotation on refresh
- NO localStorage usage - all auth via HTTP-only cookies

#### Domain Access Control
- All domain-specific resources require membership verification
- Use `verifyDomainAccess()` from `/lib/auth/domain-access.ts`
- Returns 403 Forbidden for unauthorized access
- No information leakage about inaccessible resources

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
- TaskExecution uses ONLY UserTask snapshot data (no masterTask references)

**TaskExecution Structure (Updated):**
```typescript
{
  executionId: string,
  userId: string,
  title: string,
  domainTaskId?: string,      // Reference to source DomainTask
  executionModel?: string,
  userTaskId?: string,        // Reference to UserTask
  // NO masterTaskId or masterTaskName fields
}
```

**Domain Membership:**
```typescript
user.domains: [{
  domainId: string,      // Reference to domain
  role: string | null,   // User's role in domain (null = no role selected)
  joinedAt: Date
}]
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

## MongoDB Collections

Database: `spark-ai` on port 27017

### Core Collections
- `users` - User accounts with nested identity structure
- `domains` - Domain configurations with invite codes
- `masterTasks` - Task templates with SOPs and execution models
- `domainTasks` - Domain-adopted tasks with complete snapshots
- `userTasks` - User assignments with execution data
- `taskExecutions` - Active execution sessions (domainTaskId field only)
- `executionMessages` - Chat messages within executions
- `invites` - Domain invitation management

### Index Strategy
Key indexes for performance:
- `domainTasks`: `{ domain: 1, isActive: 1 }`
- `userTasks`: `{ userId: 1, isActive: 1 }`
- `taskExecutions`: `{ userId: 1, createdAt: -1 }`, `{ domainTaskId: 1 }`

## API Integration Points

### Task Adoption (Domain Admin Only)
```
POST /api/domains/[domainId]/adopt-task
Body: { masterTaskId, customizations? }
Authorization: Bearer <token>
```

### Task Assignment (User Self-Service)
```
POST /api/domain-tasks/assign
Body: { taskId }
Authorization: Bearer <token>
```
- Verifies domain membership before assignment
- Returns: `{ success: true, userTaskId: string }`

### Task Execution (QMS-Compliant)
```
POST /api/domain-tasks/[userTaskId]/task-execution
Authorization: Bearer <token>
```
- Verifies domain membership via DomainTask lookup
- Returns error if UserTask lacks executionData
- Response: `{ executionId, isNew, task: { title, executionModel, aiAgentRole } }`

### Chat Streaming
```
POST /api/chat/stream
Body: { 
  messages: Message[],
  processName: string,
  executionModel: string,
  executionId?: string 
}
Headers: { Authorization: Bearer <token> }
Response: Server-Sent Events stream
```
Note: No longer requires masterTaskId or domainId

### Domain-Scoped Master Task Access
```
GET /api/domains/[domainId]/master-tasks/[masterTaskId]
Authorization: Bearer <token>
```
- Verifies domain membership
- Returns 403 if not a member

## AI Context Management

### System Prompt Construction
Built from UserTask snapshots in this order:
1. Base system prompt or custom prompt
2. Standard Operating Procedure (if exists)
3. Checklist items (if no SOP)
4. Required parameters with validation
5. Introduction message
6. Task context (title, description, type)
7. Domain customizations

**Important**: The system prompt is built once during TaskExecution creation and stored. Chat streaming uses this pre-built prompt.

### SSE Streaming Pattern
```typescript
// Client-side connection
const eventSource = new SSE('/api/chat/stream', {
  headers: { Authorization: `Bearer ${token}` },
  payload: JSON.stringify({
    messages,
    processName,
    executionModel,
    executionId
  })
});

// Server sends chunks
res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
```

### AI Provider Integration
- Default: Gemini 1.5 Flash
- Fallback: GPT-4o-mini
- Token tracking per message
- Automatic message persistence

## State Management Patterns

### User State Persistence
1. **MongoDB**: Source of truth for user data
2. **JWT Tokens**: Session management (HTTP-only cookies)
3. **React Context**: Runtime state management
4. **NO localStorage**: All persistence is server-side only

### Task State Flow
1. **Domain Adoption**: Creates DomainTask with complete MasterTask snapshot
2. **User Assignment**: Creates UserTask with complete DomainTask snapshot
3. **Task Execution**: Uses ONLY UserTask snapshot data

### Domain Context
- Current domain stored in `user.currentDomainId`
- Domain switching updates user document
- Most operations require active domain context

## Critical Implementation Rules

1. **NO localStorage EVER**: All persistence must be server-side only. Use HTTP-only cookies for auth.
2. **No Dynamic Fetching**: TaskExecutions must NEVER fetch from MasterTask/DomainTask
3. **Complete Snapshots**: Each level must copy ALL data needed for downstream
4. **User Verification**: Always check `user.identity.isVerified` (nested structure)
5. **Domain Access**: Verify membership before ANY domain-specific operation
6. **QMS Compliance**: New tasks require `isQMSCompliant: true` flag
7. **Model Imports**: Use exact model names (e.g., `import DomainTask from '@/app/models/DomainTask'`)
8. **Error Responses**: Use consistent format: `{ error: string }`
9. **No MasterTask Tracking**: TaskExecutions only reference DomainTask and UserTask

## Common Patterns & Solutions

### Task Assignment Flow
```typescript
// 1. User clicks unassigned task
POST /api/domain-tasks/assign
Response: { success: true, userTaskId: "..." }

// 2. Create execution immediately
POST /api/domain-tasks/[userTaskId]/task-execution
Response: { executionId: "...", isNew: true, task: {...} }

// 3. Navigate to chat
router.push(`/chat/${executionId}`)
```

### Mongoose Document Copy Pattern
```typescript
// Wrong - causes "Cast to Embedded failed"
reward: domainTask.reward

// Correct - convert to plain object
reward: domainTask.reward ? {
  amount: domainTask.reward.amount,
  currency: domainTask.reward.currency,
  displayText: domainTask.reward.displayText
} : null
```

### Domain Access Pattern
```typescript
import { verifyDomainAccess, createUnauthorizedResponse } from '@/app/lib/auth/domain-access';

// In API route
const accessCheck = await verifyDomainAccess(request, domainId);
if (!accessCheck.isValid) {
  return createUnauthorizedResponse(accessCheck.error!, accessCheck.statusCode!);
}
```

### Type Assertion for Service Results
```typescript
// When service returns additional fields not in type definition
const successResult = result as { success: true; userTask: any };
if (!successResult.userTask) {
  // Handle error
}
```

## MongoDB MCP Tools

Configure in `~/.claude/.mcp.json`:
```json
{
  "mcpServers": {
    "mongodb": {
      "command": "mcp-server-mongodb",
      "args": ["mongodb://localhost:27017/spark-ai"]
    }
  }
}
```

Available tools (prefix: `mcp__mongodb__`):
- `list-databases`, `list-collections`
- `find`, `aggregate`, `count`
- `collection-schema`, `collection-indexes`

## Debug & Development Tips

### Current Issues (See TECHNICAL_DEBT_REGISTER.md)
- Excessive debug logging (remove before production)
- Zero test coverage
- Large components (chat-interface-v2.tsx: 1000+ lines)

### VS Code Debug Configuration
- Port: 3001
- Config: `.vscode/launch.json`
- Full-stack debugging with breakpoints

### Common Development Tasks
```bash
# Check for TypeScript errors
npm run typecheck

# Find specific task in DB
mcp__mongodb__find { "collection": "domainTasks", "filter": { "_id": "..." } }

# Check user's domains
mcp__mongodb__find { "collection": "users", "filter": { "_id": "..." }, "projection": { "domains": 1 } }

# Check task execution fields
mcp__mongodb__find { "collection": "taskexecutions", "filter": { "executionId": "..." } }
```

## Recent Architecture Changes

### January 2025 Updates
1. **Removed MasterTask Tracking**: TaskExecutions no longer store masterTaskId or masterTaskName
2. **Enhanced Domain Security**: All domain-specific operations now verify membership
3. **Simplified Chat API**: Chat streaming no longer requires masterTaskId parameter
4. **Fixed Process Routes**: Replaced hardcoded mock data with proper API calls
5. **NO localStorage**: Removed all localStorage usage - server-side persistence only

## Early Stage Context
- ~12 records in database
- Not deployed to staging yet
- Focus on direct fixes over complex migrations
- Simplicity preferred over premature optimization