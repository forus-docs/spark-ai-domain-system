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

# Database Maintenance Scripts (in scripts/ directory)
npx tsx scripts/optimize-indexes.ts      # Optimize database indexes
npx tsx scripts/cleanup-old-indexes.ts   # Remove old index names
npx tsx scripts/create-named-indexes.ts  # Create readable index names

# Run any TypeScript script
npx tsx scripts/[filename].ts  # Execute any script in scripts directory

# Create QMS-compliant Read Memo task
npx tsx scripts/create-read-memo-task.ts
```

## Architecture Overview

### QMS-Compliant 3-Level Architecture (January 2025)
The system uses separate collections for complete audit trails:

```
masterTasks → domainTasks → taskExecutions (with executionMessages)
```

**Key Points:**
- **Separate Collections**: Each level has its own MongoDB collection
- **Complete Snapshots**: Each level stores complete immutable data
- **No Dynamic Fetching**: TaskExecution uses ONLY its snapshot data
- **Simplified Schema**: TaskExecution accepts any structure via `Schema.Types.Mixed`

### Collection Structure
- **masterTasks**: Task templates (no domain, no userId)
- **domainTasks**: Domain-adopted tasks with complete snapshots (has domain, no userId)
- **taskExecutions**: User executions with complete snapshots (has userId, domainId, taskSnapshot)

### Core Services Architecture

```
/app
  /[domain]                     # Domain-scoped routes
    /tasks                      # Task library and management
    /page.tsx                   # Domain home or join modal
    
  /api                          # API Routes (Next.js 14 App Router)
    /auth                       # JWT authentication endpoints
    /domain-tasks               # Task management endpoints
    /task-executions            # Execution session management
    /chat/stream                # SSE streaming for AI chat
    /domains/[domainId]/
      /adopt-task               # Domain task adoption
      /master-tasks/[id]        # Domain-scoped master task access
  
  /models                       # Mongoose schemas
    MasterTask.ts               # Task templates
    DomainTask.ts               # Domain-adopted tasks (separate collection)
    TaskExecution.ts            # User executions with flexible taskSnapshot
    ExecutionMessage.ts         # Chat messages within executions
    User.ts                     # User accounts with nested identity
    Domain.ts                   # Domain configurations
    
  /services                     # Business logic
    task-executions.ts          # TaskExecutionService, ExecutionMessageService
    domain-adoption.service.ts  # Domain task adoption logic
    
  /lib/services                 # Additional services
    conversational-form.service.ts  # Form-js chat integration
    
  /lib/auth
    jwt.ts                      # JWT token management
    domain-access.ts            # Domain membership verification
    
  /contexts                     # React Context providers
    auth-context.tsx            # JWT auth management
    domain-context.tsx          # Domain selection state
    chat-context.tsx            # Chat session management
    file-context.tsx            # File upload handling
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
  
  // Complete task snapshot - stores DomainTask as-is
  taskSnapshot: any  // Schema.Types.Mixed - accepts complete snapshot
  
  // Execution state
  status: 'assigned' | 'in_progress' | 'completed' | 'failed'
  assignedAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Messages
  messages: ObjectId[]
}
```

**Domain Membership (CRITICAL - Field Names):**
```typescript
user.domains: [{
  domainId: string,      // NOT domain.domain!
  role: string,          // Role name
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

### Core Collections (Separate for QMS Compliance)
- `users` - User accounts with nested identity structure
- `domains` - Domain configurations with invite codes
- `masterTasks` - Task templates only
- `domainTasks` - Domain-adopted tasks with complete snapshots
- `taskExecutions` - User executions with complete taskSnapshot
- `executionMessages` - Chat messages within executions
- `invites` - Domain invitation management

### Index Naming Convention
All indexes use readable names starting with `idx_`:
- `idx_user_recent` - Recent items by user
- `idx_domain_active` - Active items in domain
- `idx_text_search` - Full-text search indexes
See `/docs/database-indexes.md` for complete documentation.

### Collection Queries
```typescript
// Find MasterTasks (templates) - in masterTasks collection
{ isActive: true }

// Find DomainTasks - in domainTasks collection
{ domain: "domainId" }

// Find TaskExecutions - in taskExecutions collection
{ userId: "userId", domainId: "domainId" }
```

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

### Get Available Tasks
```
GET /api/domain-tasks/master?domain={domainId}
Authorization: Bearer <token>
```
- Returns available DomainTasks for assignment

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
- Domain-specific routing: `/{domain-slug}/...`

## Critical Implementation Rules

1. **No Dynamic Fetching**: TaskExecutions must NEVER fetch from MasterTask/DomainTask
2. **Complete Snapshots**: Each level must copy ALL data needed for downstream
3. **User Verification**: Always check `user.identity.isVerified` (nested structure)
4. **Domain Access**: Check `user.domains[].domainId` NOT `domain.domain`
5. **Use `.toObject()`**: Convert Mongoose documents before storing snapshots
6. **Error Responses**: Use consistent format: `{ error: string }`
7. **Direct Navigation**: After assignment, navigate directly to `/chat/{executionId}`
8. **Separate Collections**: masterTasks, domainTasks, taskExecutions are SEPARATE

## Common Patterns & Solutions

### Task Assignment Flow
```typescript
// 1. User clicks unassigned task
POST /api/domain-tasks/assign
Response: { success: true, executionId: "..." }

// 2. Navigate directly to chat
router.push(`/chat/${executionId}`)
```

### TaskExecution Snapshot Pattern
```typescript
// Wrong - complex transformations and field mapping
taskSnapshot: {
  title: domainTask.title,
  procedures: domainTask.procedures.map(...),
  // etc - causes CastErrors
}

// Correct - store complete snapshot as-is
const domainTaskObj = domainTask.toObject();
taskSnapshot: domainTaskObj
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

### Common Query Patterns
```typescript
// Check domain membership (CRITICAL)
const hasDomainAccess = user.domains?.some(
  d => d.domainId === domainId  // NOT d.domain!
);

// Find DomainTask by ID
const domainTask = await DomainTask.findById(domainTaskId);

// Check if task already adopted
const existing = await DomainTask.findOne({
  domain: domainId,
  masterTaskId: masterTaskId
});
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
1. **Separated Collections**: masterTasks, domainTasks, taskExecutions now in separate collections
2. **Simplified TaskExecution**: taskSnapshot uses Schema.Types.Mixed to accept any structure
3. **Fixed Domain Access**: Corrected field name from `domain.domain` to `domainId`
4. **Complete Snapshots**: Each level stores complete immutable data
5. **Direct Assignment**: Creates TaskExecution immediately on assignment
6. **No Data Transformation**: Store DomainTask snapshot as-is in TaskExecution

## Form-js Integration
- Installed `@bpmn-io/form-js` for form rendering and validation
- Conversational UI for form completion with document extraction
- Form schemas stored in `MasterTask.formSchema`
- Custom `ConversationalFormService` for chat-based form filling

## UI Component Patterns

### Tasks Page (`/[domain]/tasks`)
- Full library view with MasterTask templates
- Modal detail view for task information
- Adopt button in footer for domain admins
- Copy/download icons in header
- Responsive card layout for domain tasks

### Task Assignment
- Domain tasks shown in card view
- Click to assign creates TaskExecution immediately
- Direct navigation to chat interface
- No intermediate confirmation steps

### Chat Interface
- Uses TaskExecution snapshot data
- Conversational form rendering for form-based tasks
- Real-time streaming with SSE
- Token tracking and display