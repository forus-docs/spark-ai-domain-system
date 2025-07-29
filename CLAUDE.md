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

# VS Code Debug
# Press F5 or use Run and Debug panel - configured for port 3001
```

## Architecture Overview

### Three-Tier Data Architecture (January 2025)

**CRITICAL**: Data flows through THREE SEPARATE MongoDB collections:

```
masterTasks (collection) → domainTasks (collection) → taskExecutions (collection)
     ↓                           ↓                            ↓
  Templates                Domain copies              User assignments
  (domain: "")            (domain: "id")             (with execution)
```

**Key Points:**
- **THREE SEPARATE COLLECTIONS** - Not a unified collection
- Each level contains COMPLETE SNAPSHOT - no dynamic lookups
- UserTask model removed - merged into TaskExecution
- QMS compliance through immutable snapshots

### MongoDB Collections Map

```
Database: spark-ai (port 27017)

TASK COLLECTIONS:
- masterTasks     → MasterTask templates (domain: "" or null)
- domainTasks     → Domain-adopted tasks (separate collection!)
- taskExecutions  → User assignments with execution state

USER/DOMAIN COLLECTIONS:
- users           → User accounts with nested identity
- domains         → Domain configurations with invite codes
- invites         → Domain invitation management

MESSAGING COLLECTIONS:
- executionMessages    → Chat messages within task executions
- workstreamMessages   → Group chat messages (Socket.io)

LEGACY COLLECTIONS (being phased out):
- userTasks       → Merged into taskExecutions (DO NOT USE)
- workstreams     → Using taskExecutions with taskType: 'workstream'
```

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
  
  // Workstream support
  // For workstreams: taskSnapshot.members contains array of users
}
```

**Domain Membership:**
```typescript
user.domains: [{
  domain: ObjectId,      // Reference to domain
  domainId: ObjectId,    // Also check this field!
  role: ObjectId,       // User's role in domain  
  joinedAt: Date
}]
```

**ExecutionMessage Structure:**
```typescript
{
  messageId: string
  executionId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  content_parts?: Array<{
    type: 'text' | 'image_url' | 'code' | 'file'
    // Type-specific fields
  }>
  tokenCount?: number
  // ... other fields
}
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

### Task Adoption Flow

1. **MasterTask → DomainTask**
   - API: `POST /api/domains/[domainId]/adopt-task`
   - Source: `masterTasks` collection
   - Destination: `domainTasks` collection (SEPARATE!)
   - Creates complete snapshot with all MasterTask data

2. **DomainTask → TaskExecution**
   - API: `POST /api/domain-tasks/assign`
   - Source: `domainTasks` collection  
   - Destination: `taskExecutions` collection
   - Creates TaskExecution with complete task snapshot
   - User navigates directly to `/chat/{executionId}`

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
4. **Domain Access**: Check `domains.domainId` field
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

### Chat Interface Patterns

#### "/" Command for Domain Tasks
```typescript
// Detect slash command in input
if (input === '/') {
  setShowDomainTasksDrawer(true);
}

// DomainTasksDrawer shows available tasks
<DomainTasksDrawer 
  isOpen={showDomainTasksDrawer}
  onTaskSelect={handleTaskSelect}
/>
```

#### Copy/Download Chat
```typescript
// Copy button in header
const handleCopyChat = () => {
  const chatText = messages.map(msg => 
    `[${timestamp}] ${role}: ${content}`
  ).join('\n\n');
  navigator.clipboard.writeText(chatText);
};

// Download as markdown
const handleDownloadChat = () => {
  const blob = new Blob([chatMarkdown], { type: 'text/markdown' });
  // ... download logic
};
```

#### Task Snapshot Popup
```typescript
// Code icon shows task data
<TaskSnapshotPopup 
  taskSnapshot={taskExecution.taskSnapshot}
  executionId={executionId}
/>
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

### Finding Tasks in Correct Collections

```typescript
// Find MasterTasks (templates)
await MasterTask.find({ 
  domain: { $in: ['', null] },
  isActive: true 
})

// Find DomainTasks - USE DomainTask MODEL!
await DomainTask.find({ 
  domain: domainId,
  isActive: true 
})

// Find TaskExecutions for user
await TaskExecution.find({
  userId: userId,
  domainId: domainId,
  status: { $ne: 'completed' }
})
```

### Workstream Implementation

Workstreams use existing collections:
- DomainTask with `taskType: 'workstream_basic'`
- TaskExecution with workstream members in taskSnapshot
- ExecutionMessage for chat messages

```typescript
// Check if task has AI
const hasAI = taskSnapshot?.aiAgentAttached !== false;
// Hide AI UI elements (tokens, cost) if no AI attached
```

### Domain User Query Pattern

```typescript
// Check membership - domains array has nested structure
const isMember = user.domains.some((d: any) => 
  d.domain?.toString() === domainId || 
  d.domainId?.toString() === domainId  // Check both fields!
);
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

### Common Debugging Queries

```bash
# Check if DomainTask exists (correct collection!)
mcp__mongodb__find { 
  "database": "spark-ai",
  "collection": "domainTasks",
  "filter": { "domain": "domainId", "taskType": "workstream_basic" } 
}

# Check user's domains (nested structure)
mcp__mongodb__find { 
  "database": "spark-ai",
  "collection": "users",
  "filter": { "_id": "userId" },
  "projection": { "domains": 1 } 
}

# Verify TaskExecution has full snapshot
mcp__mongodb__find { 
  "database": "spark-ai",
  "collection": "taskExecutions",
  "filter": { "executionId": "..." },
  "projection": { "taskSnapshot": 1 } 
}
```

## Recent Architecture Changes

### January 2025 Updates
- domainTasks is a SEPARATE collection, not part of masterTasks
- UserTask model removed - functionality merged into TaskExecution
- Workstreams implemented using existing task infrastructure
- Direct assignment flow: DomainTask → TaskExecution → Chat
- Added "/" command in chat for domain task selection
- Added copy/download chat functionality
- Added task snapshot viewer (code icon)
- Planning @chatscope/chat-ui-kit-react integration

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

### Chat Interface (`/chat/[executionId]`)
- Uses TaskExecution snapshot data
- Checks `taskSnapshot.aiAgentAttached` for AI features
- Hides token count, cost, LLM provider for non-AI tasks
- Conversational form rendering for form-based tasks
- "/" command opens DomainTasksDrawer
- Copy/download buttons in header
- Code icon shows task snapshot

### Upcoming: @chatscope Integration
- Feature flags for safe rollout
- WhatsApp-style attachment menu
- Enhanced message components
- See `CHATSCOPE_SPRINT_PLAN.md` for details

## Common Pitfalls to Avoid

1. **DON'T** look for DomainTasks in masterTasks collection
2. **DON'T** use MasterTask model for domainTasks queries
3. **DON'T** assume unified collection when docs mention it
4. **DON'T** forget to check both domain fields in user.domains
5. **DON'T** dynamically fetch from parent collections
6. **DON'T** create UserTask - use TaskExecution directly
7. **DON'T** forget null checks for currentDomain in components
8. **DON'T** use complex transformations when storing snapshots - use `.toObject()`