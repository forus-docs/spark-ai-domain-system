# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical QMS Rules

1. **QMS Environment - Constant improvement in small steps**
   - Break ALL changes into small, testable increments
   - Document every change with clear rationale
   - No massive refactors without explicit approval

2. **Never overcomplicate stuff**
   - Always choose the simplest solution that works
   - Question any complex patterns or abstractions
   - Favor readability over cleverness

3. **If in doubt, ask**
   - Ask for clarification before making assumptions
   - Present options when there are multiple approaches
   - Flag any decisions that could have significant impact

4. **Wait for explicit instructions**
   - Do NOT make code changes unless explicitly asked
   - Treat explanations as educational, not action requests
   - If something seems broken, describe it and ask before fixing

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

### Unified Data Schema
The system uses a **single MasterTask model** for all task-related data:
- **MasterTask** (template): `domain: ""` or `null`, no `userId`
- **DomainTask**: `domain: "domainId"`, no `userId` 
- **UserTask**: Both `domain` and `userId` populated
- All use the same MasterTask collection with different field combinations

### Simplified Architecture (January 2025)
The system has been simplified from a 5-level hierarchy to 3 levels:

```
MasterTask → DomainTask → TaskExecution (with messages)
```

**Key Changes:**
- UserTask and TaskExecution merged into single TaskExecution model
- TaskExecution contains complete task snapshot at assignment time
- No intermediate UserTask lookup required
- Status tracking (assigned, in_progress, completed) built into TaskExecution

### QMS-Compliant Data Flow
Each arrow represents a COMPLETE data copy, not a reference. This ensures:
- Changes require explicit approval at each level
- Running tasks cannot change mid-execution  
- Complete audit trail for compliance

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
    MasterTask.ts              # Unified schema for all task types
    TaskExecution.ts           # Combined user assignment + execution
    ExecutionMessage.ts        # Chat messages within executions
    User.ts                    # User accounts with nested identity
    Domain.ts                  # Domain configurations
    
  /services                     # Business logic
    task-executions.ts         # TaskExecutionService, ExecutionMessageService
    domain-adoption.service.ts # QMS-compliant adoption logic
    
  /lib/services                # Legacy services (being phased out)
    task-journey.service.ts    # Facade for task operations
    task-assignment.service.ts # Task assignment logic (stub)
    task-completion.service.ts # Task completion logic (stub)
    task-display.service.ts    # Task display formatting (stub)
    task-interaction.service.ts # Task interaction operations (stub)
    
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
- Access token stored in localStorage

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

**TaskExecution Structure:**
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

**Domain Membership:**
```typescript
user.domains: [{
  domain: ObjectId,      // Reference to domain
  role: ObjectId,        // User's role in domain
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
- `masterTasks` - Unified collection for all task types (master/domain/user)
- `taskExecutions` - Combined user assignment + execution sessions
- `executionMessages` - Chat messages within executions
- `invites` - Domain invitation management

### Collection Queries
```typescript
// Find MasterTasks (templates)
{ isActive: true, $or: [{ domain: { $exists: false } }, { domain: "" }, { domain: null }] }

// Find DomainTasks
{ domain: "domainId", userId: { $exists: false } }

// Find UserTasks (legacy - being phased out)
{ domain: "domainId", userId: "userId" }
```

### Index Strategy
Key indexes for performance:
- `masterTasks`: `{ domain: 1, isActive: 1 }`, `{ masterTaskId: 1 }`
- `taskExecutions`: `{ userId: 1, createdAt: -1 }`, `{ domainId: 1, userId: 1 }`

## API Integration Points

### Task Adoption (Domain Admin)
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
- Creates TaskExecution directly
- Returns: `{ success: true, executionId: string }`
- Navigate to `/chat/{executionId}` immediately

### Chat Streaming
```
POST /api/chat/stream
Body: { 
  messages: Message[],
  processName: string,
  executionModel: string,
  executionId: string  // Required - no ad-hoc execution creation
}
Headers: { Authorization: Bearer <token> }
Response: Server-Sent Events stream
```

### Get Available Tasks for Adoption
```
GET /api/domains/[domainId]/adopt-task
Authorization: Bearer <token>
```
- Returns MasterTasks available for domain adoption
- Filters out already adopted tasks

## AI Context Management

### System Prompt Construction
Built from TaskExecution snapshot in this order:
1. Base system prompt or custom prompt
2. Standard Operating Procedure (if exists)
3. Checklist items (if no SOP)
4. Required parameters with validation
5. Introduction message
6. Task context (title, description, type)
7. Domain customizations

### SSE Streaming Pattern
```typescript
// Client-side connection
const eventSource = new SSE('/api/chat/stream', {
  headers: { Authorization: `Bearer ${token}` },
  payload: JSON.stringify({
    messages,
    processName,
    executionModel,
    executionId  // Required
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
2. **JWT Tokens**: Session management
3. **localStorage**: `spark-user`, `spark-refresh-token`
4. **React Context**: Runtime state management

### Task State Flow
1. **Domain Adoption**: Creates DomainTask entry with complete MasterTask snapshot
2. **User Assignment**: Creates TaskExecution with complete task snapshot
3. **Chat Execution**: Uses TaskExecution snapshot data directly

### Domain Context
- Current domain stored in `user.currentDomainId`
- Domain switching updates user document
- Most operations require active domain context
- Domain.id can be either ObjectId or slug depending on context

## Critical Implementation Rules

1. **No Dynamic Fetching**: TaskExecutions must NEVER fetch from MasterTask/DomainTask
2. **Complete Snapshots**: Each level must copy ALL data needed for downstream
3. **User Verification**: Always check `user.identity.isVerified` (nested structure)
4. **Domain Access**: Verify membership before ANY domain-specific operation
5. **QMS Compliance**: New tasks require `isQMSCompliant: true` flag
6. **Model Imports**: Use exact model names (e.g., `import MasterTask from '@/app/models/MasterTask'`)
7. **Error Responses**: Use consistent format: `{ error: string }`
8. **Direct Navigation**: After assignment, navigate directly to `/chat/{executionId}`
9. **Unified Schema**: Remember MasterTask collection stores all task types

## Common Patterns & Solutions

### Task Assignment Flow
```typescript
// 1. User clicks unassigned task
POST /api/domain-tasks/assign
Response: { success: true, executionId: "..." }

// 2. Navigate directly to chat
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

### MasterTask Query Patterns
```typescript
// Find true MasterTasks (templates)
{ isActive: true, $or: [{ domain: { $exists: false } }, { domain: "" }, { domain: null }] }

// Find DomainTasks for a domain
{ domain: domainId, userId: { $exists: false } }

// Check if task adopted by domain
{ domain: domainId, masterTaskId: masterTaskId }
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

### Current Technical Debt
- Excessive debug logging (remove before production)
- Zero test coverage
- Large components (chat-interface-v2.tsx: 1000+ lines)
- Legacy service stubs in /lib/services being phased out

### VS Code Debug Configuration
- Port: 3001
- Config: `.vscode/launch.json`
- Full-stack debugging with breakpoints

### Common Development Tasks
```bash
# Check for TypeScript errors
npm run typecheck

# Find specific task in DB
mcp__mongodb__find { "collection": "masterTasks", "filter": { "_id": "..." } }

# Check user's domains
mcp__mongodb__find { "collection": "users", "filter": { "_id": "..." }, "projection": { "domains": 1 } }

# Check task executions
mcp__mongodb__find { "collection": "taskExecutions", "filter": { "userId": "..." } }

# Verify MasterTask availability
mcp__mongodb__find { "collection": "masterTasks", "filter": { "isActive": true, "domain": "" } }
```

## Recent Architecture Changes

### January 2025 Updates
1. **Simplified Architecture**: Merged UserTask + TaskExecution into single model
2. **Direct Assignment Flow**: Task assignment creates execution immediately
3. **Enhanced Domain Security**: All domain-specific operations verify membership
4. **Unified Schema**: All task types use MasterTask collection
5. **Library View Fix**: Corrected queries for MasterTask filtering

## Early Stage Context
- ~12 records in database
- Not deployed to staging yet
- Focus on direct fixes over complex migrations
- Simplicity preferred over premature optimization

## Form-js Integration
- Installed `@bpmn-io/form-js` for form rendering and validation
- Conversational UI for form completion with document extraction
- Form schemas stored in `MasterTask.formSchema`
- Custom `ConversationalFormRenderer` service for chat-based form filling

## UI Component Patterns

### Library View (MasterTask Display)
- Shows MasterTask templates without execution state
- Displays all available fields dynamically
- No state simulation - templates are stateless
- Detail view adapts to show whatever fields exist in the data

### Task Assignment
- Domain tasks shown in card view
- Click to assign creates TaskExecution immediately
- Direct navigation to chat interface
- No intermediate confirmation steps