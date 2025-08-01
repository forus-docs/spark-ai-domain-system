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

## Documentation Organization Rules

**CRITICAL**: All documentation MUST be organized in the `/documentation` folder:

```
/documentation/
  /architecture/    # System design, technical architecture
  /planning/        # Sprint plans, feature planning
  /reports/         # Analysis reports, audits
  /guides/          # How-to guides, patterns
  README.md         # Documentation index
```

**Rules:**
1. **NO documentation in project root** (except README.md and CLAUDE.md)
2. **Use appropriate subfolder** based on document type
3. **File naming**: UPPERCASE_WITH_UNDERSCORES.md
4. **Always update** `/documentation/README.md` when adding new docs
5. **Cross-references**: Use relative paths between documents

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

# VS Code Debug
# Press F5 or use Run and Debug panel - configured for port 3001

# Development Server
# Note: npm run dev runs server-dev.js with WebSocket/Socket.IO support
# Production: npm start runs server.js
```

## PostgreSQL Configuration

**PostgreSQL** is running on port 5433 via Docker Compose for the Camunda integration.
**Note**: Local PostgreSQL 17 installation runs on port 5432.

### PostgreSQL Database Credentials
- **Host**: localhost or 127.0.0.1
- **Port**: 5433
- **Username**: postgres
- **Password**: postgres
- **Database**: camunda
- **Container**: app-netbuild-postgres-1

### Docker Management
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f camunda
# Future: docker-compose logs -f keycloak

# Stop services
docker-compose down

# Remove everything (including volumes)
docker-compose down -v
```

**Note**: Keycloak service will be added to docker-compose.yml for production use.

### PostgreSQL MCP Configuration
PostgreSQL MCP is configured in the project-local `.mcp.json` file.
- Connects to PostgreSQL on port 5433 (Docker container)
- Database: camunda
- Credentials: postgres/postgres

Use tools with prefix `mcp__postgres__` after restart.

## High-Level Architecture

### Three-Tier Data Flow (QMS-Compliant)

NetBuild implements a strict three-tier architecture where data flows through complete snapshots:

```
┌─────────────────┐
│  MASTER TASKS   │ ← "Master library of all task templates"
│   (library of   │
│  task templates │
│   with SOPs)    │
└────────┬────────┘
         │ adopted by domain
         ▼
┌─────────────────┐
│  DOMAIN TASKS   │ ← "Tasks this domain has adopted"
│ (domain-specific│
│  configurations)│
└────────┬────────┘
         │ assigned to user
         ▼
┌─────────────────┐
│   USER TASKS    │ ← "Tasks assigned to specific users"
│ (user's assigned│
│     tasks)      │
└────────┬────────┘
         │ executed as
         ▼
┌─────────────────┐
│ TASK EXECUTIONS │ ← "Active task execution sessions"
│   (execution    │
│    sessions)    │
└─────────────────┘
```

**Critical Points:**
- Each tier is a **SEPARATE MongoDB collection** (not unified)
- Complete snapshots stored at each level (no dynamic lookups)
- Immutable data ensures QMS compliance and audit trails
- UserTask model removed - functionality merged into TaskExecution
- All new tasks must be marked with `isQMSCompliant: true`

### Authentication & Authorization

**OAuth2/Keycloak Strategy (Current):**
- Authentication via Keycloak SSO
- NextAuth.js manages sessions (JWT removed completely)
- Keycloak handles token refresh
- Users auto-provisioned on first login
- Domain membership verified via `verifyDomainAccess()`
- SSO across all applications
- Proper Camunda session context

**Migration from JWT:**
- All API routes now use `getServerSession(authOptions)` instead of JWT verification
- No more `@/app/lib/auth/jwt` imports
- Session-based authentication throughout

**Critical User Structure:**
```typescript
user.identity.isVerified    // NOT user.isVerified
user.domains[].domain       // Check both domain and domainId fields
user.domains[].domainId     // Legacy field still in use
```

### Request Flow Pattern

```
Client → Next.js App Router → JWT Verify → Domain Access Check → Service Layer → MongoDB
```

All domain-scoped resources require membership verification. Returns 403 without leaking resource existence.

### Development Server Architecture

- **Development**: `npm run dev` runs `server-dev.js` with WebSocket/Socket.IO support
- **Production**: `npm start` runs `server.js`
- **WebSocket**: Socket.IO server runs on same port (3001) with CORS configured
- **Real-time**: Supports both SSE (current) and WebSocket (future) communications

### Dynamic Domain Routing

The app uses Next.js dynamic routing with `[domain]` segments:

```
/app/[domain]/tasks/page.tsx     → Handles ALL domains dynamically
/app/[domain]/page.tsx           → Domain home for ALL domains
```

**How it works:**
1. URL `/maven-hub/tasks` extracts "maven-hub" as domain slug
2. `DomainProvider` validates the slug and sets current domain
3. Page components fetch domain-specific data using context
4. One component serves all domains - no static pages per domain

**Key Points:**
- Routes like `/[domain]/tasks` are fully dynamic
- Domain filtering happens via API calls using `currentDomain.id`
- Access control enforced by `DomainProvider`
- Redirects to `/domains` if user lacks access (which then redirects to appropriate page)

**Domain Navigation:**
- `/explore-domains` - Browse and join new domains
- `/domains` - Legacy redirect (sends to current domain or /explore-domains)
- User menu - Quick domain switching for joined domains

## Database Architecture

**Database:** `netbuild` on port 27017

### Core Collections

| Collection | Purpose | Key Points |
|------------|---------|------------|
| `masterTasks` | Task templates | `domain: ""` or `null` for templates |
| `domainTasks` | Domain-adopted tasks | Separate collection with complete snapshots |
| `taskExecutions` | User assignments | Contains full `taskSnapshot` from DomainTask |
| `executionMessages` | Chat messages | Linked to taskExecutions |
| `users` | User accounts | Nested `identity` structure |
| `domains` | Domain configs | Includes invite codes and roles |

### Critical Implementation Rules

1. **TaskExecution Snapshots**: Store complete DomainTask using `.toObject()` - no transformations
2. **Domain Task Queries**: Use `DomainTask` model, NOT `MasterTask.find({ domain })`
3. **User Verification**: Check `user.identity.isVerified` (nested structure)
4. **Domain Membership**: Check both `domains[].domain` and `domains[].domainId`
5. **No Dynamic Fetching**: TaskExecutions must never fetch from parent collections

## Task Adoption & Assignment Flow

### 1. Domain Adoption (Admin Only)
```
POST /api/domains/[domainId]/adopt-task
Body: { masterTaskId, customizations? }
→ Creates DomainTask with complete MasterTask snapshot
```

### 2. User Assignment (Self-Service)
```
POST /api/domain-tasks/assign
Body: { taskId }
→ Creates TaskExecution with complete task snapshot
→ Returns: { success: true, executionId: "..." }
→ Navigate directly to /chat/{executionId}
```

### 3. Chat Execution
```
POST /api/chat/stream (SSE endpoint)
Body: { messages, executionId, processName, executionModel }
→ Uses TaskExecution snapshot data only
→ Streams AI responses with token tracking
```

## AI Context Management

System prompts are built from TaskExecution snapshots in this order:
1. Base/custom prompt
2. Standard Operating Procedure (if exists)
3. Checklist items (if no SOP)
4. Required parameters
5. Introduction message
6. Task context
7. Domain customizations

**Providers:** Gemini 1.5 Flash (default), GPT-4o-mini (fallback)

## Common Patterns

### Workstream Support
- Uses `taskType: 'workstream_basic'` in DomainTask
- Members stored in `taskSnapshot.members`
- Check `aiAgentAttached` to show/hide AI UI elements

### Chat Interface Features
- "/" command opens DomainTasksDrawer
- Copy/download buttons for chat export
- Code icon shows task snapshot data

### Error Handling
- Consistent format: `{ error: string }`
- Domain access returns 403 (no info leakage)
- CastErrors usually mean incorrect snapshot storage

## Environment Configuration

Required `.env.local`:
```
# Database
MONGODB_URI=mongodb://localhost:27017/netbuild

# NextAuth/Keycloak
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<32+ chars>
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=netbuild
KEYCLOAK_CLIENT_ID=netbuild-app
KEYCLOAK_CLIENT_SECRET=<your-client-secret>
KEYCLOAK_ISSUER=http://localhost:8081/realms/netbuild
USE_KEYCLOAK=true
NEXT_PUBLIC_USE_KEYCLOAK=true

# Legacy (can be removed after full migration)
SESSION_SECRET=<32+ chars>
CREDS_KEY=<32 char encryption key>
CREDS_IV=<16 char IV>

# AI Providers
OPENAI_API_KEY=<OpenAI API key>
GEMINI_API_KEY=<Google Gemini API key>
```

## MongoDB MCP Tools

**IMPORTANT**: Project-local `.mcp.json` takes precedence over global `~/.claude/.mcp.json`

The project includes `.mcp.json` with MongoDB, PostgreSQL, and Camunda configurations:
- **MongoDB**: Points to `netbuild` database
- **PostgreSQL**: Connects to port 5433 (Docker container)
- **Camunda**: Connects to http://localhost:8080/engine-rest

Use tools with prefix `mcp__mongodb__` (e.g., `mcp__mongodb__find`)

## Common Debugging Queries

```javascript
// Check if DomainTask exists (correct collection!)
mcp__mongodb__find({ 
  database: "netbuild",
  collection: "domainTasks",
  filter: { domain: "domainId", taskType: "workstream_basic" } 
})

// Check user's domains (nested structure)
mcp__mongodb__find({ 
  database: "netbuild",
  collection: "users",
  filter: { _id: "userId" },
  projection: { domains: 1 } 
})

// Verify TaskExecution has full snapshot
mcp__mongodb__find({ 
  database: "netbuild",
  collection: "taskExecutions",
  filter: { executionId: "..." },
  projection: { taskSnapshot: 1 } 
})
```

## Common Pitfalls

1. **DON'T** query DomainTasks from masterTasks collection
2. **DON'T** use complex transformations when storing snapshots
3. **DON'T** forget both domain fields in user.domains array
4. **DON'T** create UserTask documents (removed model)
5. **DON'T** assume collections are unified when separate

## Recent Changes (January 2025)

- Renamed from Spark AI to NetBuild
- Three separate collections for task tiers
- UserTask model removed (merged into TaskExecution)
- Added "/" command for task selection in chat
- Planning @chatscope/chat-ui-kit-react integration
- PostgreSQL added for Camunda integration
- WebSocket/Socket.IO support added to dev server
- **BPM Domain**: Special domain for Camunda integration with separate sidebar
- **Camunda Tasklist**: Basic integration implemented, full implementation planned
- **Keycloak Integration**: Fully implemented OAuth2/OIDC authentication with NextAuth
- **Filter Implementation**: Added filter-based task fetching (limited by auth constraints)
- **JWT to NextAuth Migration**: Removed all JWT authentication in favor of NextAuth sessions
- **Domain Navigation Refactor**: Separated domain switching (in user menu) from domain browsing (/explore-domains)

## Camunda Integration (Active)

NetBuild is transitioning to become a UI layer on top of Camunda 7:

```
┌─────────────────────────────────────────────────────────────────┐
│                   NetBuild UI (Next.js 14)                       │
│  Chat Interface • Domain Management • Real-time Updates          │
├─────────────────────────────────────────────────────────────────┤
│                      API Gateway Layer                           │
│         Intelligent routing to appropriate Camunda service       │
├─────────────────────────────────────────────────────────────────┤
│     Camunda 7 Services          │        NetBuild Services      │
│  • Process Engine               │   • WebSocket Server          │
│  • User Management              │   • AI Integration            │
│  • Task Management              │   • Chat Orchestration        │
│  • BPMN Execution               │   • Event Bridge              │
├─────────────────────────────────┴───────────────────────────────┤
│                    PostgreSQL Database                           │
│         Unified storage for all workflow and app data            │
└─────────────────────────────────────────────────────────────────┘
```

### Current Status (January 2025)
- ✅ PostgreSQL running on port 5433 via Docker
- ✅ Camunda 7.20.0 running on port 8080
- ✅ Database initialized with 49 tables
- ✅ Demo users and processes deployed
- ✅ Both services healthy and connected

### Access Points
- **Camunda Web Apps**: http://localhost:8080
  - Username: admin
  - Password: admin
- **Camunda REST API**: http://localhost:8080/engine-rest
- **Container**: app-netbuild-camunda-1

### Demo Users
- demo/demo (has admin privileges)
- john/john  
- mary/mary
- peter/peter

**Important Demo Features:**
1. **User Provisioning**: New users are provisioned by administrators - no self-registration
2. **Easy User Switching**: Demo setup allows quick user switching for demonstrations
3. **Non-Responsive UI**: The Camunda app is not mobile-responsive
4. **NetBuild Integration**: These demo principles also apply to NetBuild for testing multi-user workflows
5. **No Multi-Tenancy**: Demo runs at root level without tenant isolation - all processes and users share the same space

See `/documentation/architecture/CAMUNDA_INTEGRATION_PLAN.md` for migration details.

## Keycloak Integration (Implemented)

### Why Keycloak is Required

**CRITICAL**: Camunda filters with expressions like `${currentUser()}` and `${currentUserGroups()}` require authenticated sessions that HTTP Basic Auth cannot provide.

**Current Limitation**: Our implementation uses HTTP Basic Auth which:
- ❌ Cannot execute filters with dynamic expressions
- ❌ Doesn't create server-side authentication context
- ❌ Results in "Unable to invoke method 'taskAssignee'" errors

**Keycloak Solution**: Provides OAuth2/OIDC authentication that:
- ✅ Creates proper Camunda sessions
- ✅ Enables filter expressions to work correctly
- ✅ Provides Single Sign-On (SSO) across applications
- ✅ Centralizes user and group management

### Architecture with Keycloak

```
┌─────────────────────────────────────────────────────────────────┐
│                   NetBuild UI (Next.js 14)                       │
│  Chat Interface • Domain Management • Real-time Updates          │
├─────────────────────────────────────────────────────────────────┤
│                      Keycloak Auth Layer                         │
│      OAuth2/OIDC • Token Management • User Federation           │
├─────────────────────────────────────────────────────────────────┤
│                      API Gateway Layer                           │
│    Token Validation • Session Creation • Context Propagation     │
├─────────────────────────────────────────────────────────────────┤
│     Camunda 7 Services          │        NetBuild Services      │
│  • Process Engine               │   • WebSocket Server          │
│  • Identity Service             │   • AI Integration            │
│  • Task Management              │   • Chat Orchestration        │
│  • BPMN Execution               │   • Event Bridge              │
├─────────────────────────────────┴───────────────────────────────┤
│                    PostgreSQL Database                           │
│         Unified storage for all workflow and app data            │
└─────────────────────────────────────────────────────────────────┘
```

### Keycloak Configuration (Implemented)

**Service Configuration:**
- **Port**: 8081 (to avoid conflict with Camunda on 8080)
- **Realm**: `netbuild`
- **Client**: `netbuild-app` (OAuth2 confidential client)
- **Integration**: NextAuth.js with Keycloak provider
- **Self-Registration**: Enabled with auto-provisioning

**User Provisioning:**
- Users auto-created in MongoDB on first login
- Profile synced from Keycloak (name, email, username)
- Domain membership managed in NetBuild
- Identity marked as verified via Keycloak

### Authentication Flow with Keycloak

1. **User Login**:
   - User accesses NetBuild
   - Redirected to Keycloak login
   - Authenticates with username/password

2. **Token Exchange**:
   - Keycloak issues OAuth2 tokens
   - NetBuild stores tokens securely
   - Tokens included in API requests

3. **Camunda Session**:
   - Camunda validates OAuth token
   - Creates authenticated session
   - Sets identity context for expressions

4. **Filter Execution**:
   - `${currentUser()}` resolves correctly
   - Group-based filters work
   - All Camunda features available

### Implementation Requirements

**Docker Compose Addition:**
```yaml
keycloak:
  image: quay.io/keycloak/keycloak:latest
  environment:
    - KEYCLOAK_ADMIN=admin
    - KEYCLOAK_ADMIN_PASSWORD=admin
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
    - KC_DB_USERNAME=postgres
    - KC_DB_PASSWORD=postgres
  ports:
    - "8081:8080"
  depends_on:
    - postgres
```

**Camunda Configuration:**
- Install `camunda-bpm-identity-keycloak` plugin
- Configure OAuth2 resource server
- Map Keycloak claims to Camunda identity

**NetBuild Updates:**
- Add OAuth2 client library
- Implement token refresh logic
- Update API calls to use Bearer tokens
- Add login/logout UI components

### Migration Status

1. **Phase 1**: ✅ Basic Auth kept for development
2. **Phase 2**: ✅ Keycloak container added to Docker Compose
3. **Phase 3**: ✅ Keycloak realm configured with self-registration
4. **Phase 4**: ⏳ Camunda Keycloak plugin pending
5. **Phase 5**: ✅ NetBuild migrated to OAuth2 authentication
6. **Phase 6**: ✅ JWT deprecated, NextAuth implemented

### BPM Domain Implementation
NetBuild includes a special "bpm" domain that provides Camunda integration:

**Features:**
- **Separate Sidebar**: Orange-themed BPM sidebar with Camunda branding
- **User Switching**: Quick switch between demo users (demo, john, mary, peter)
- **Tasklist Integration**: Basic task list at `/[domain]/tasklist`
- **API Proxy**: Routes through `/api/camunda/*` endpoints
- **Dual Authentication**: NetBuild JWT + Camunda Basic Auth

**Implementation Status:**
- ✅ Basic task list with claim/unclaim
- ✅ Task details panel
- ✅ Simple form completion
- ⏳ Advanced features planned (see `/documentation/planning/CAMUNDA_TASKLIST_FULL_IMPLEMENTATION_PLAN.md`)

## Camunda MCP Configuration

The Camunda MCP is implemented using FastMCP and located at `/Users/jacquesvandenberg/eos-forus/digital/mcp-camunda-fastmcp/`.

### Available Camunda MCP Tools

After restart, the following tools are available with prefix `mcp__camunda__`:

**Process Definitions:**
- `list_process_definitions` - List deployed process definitions
- `count_process_definitions` - Count process definitions

**Process Instances:**
- `list_process_instances` - List process instances
- `count_process_instances` - Count process instances
- `start_process_instance` - Start a new process instance
- `get_process_variables` - Get variables for a process instance

**User Tasks:**
- `list_user_tasks` - List user tasks
- `count_user_tasks` - Count user tasks
- `complete_user_task` - Complete a user task

### Configuration
Camunda MCP is configured in the project-local `.mcp.json` file.
- Connects to Camunda REST API at http://localhost:8080/engine-rest/
- Currently uses Basic Auth (limited functionality)
- **Note**: Will require OAuth2 tokens when Keycloak is implemented
- Implemented in Python using FastMCP framework
- PYTHONPATH points to: /Users/jacquesvandenberg/eos-forus/digital/mcp-camunda-fastmcp

## Data Migration Scripts

```bash
# QMS Compliance
npx tsx scripts/migrate-to-qms-compliant.js      # Create QMS-compliant tasks
npx tsx scripts/cleanup-non-compliant-tasks.js   # Clean up after verification

# Database Maintenance
npx tsx scripts/rename-collections.js            # Rename collections if needed
npx tsx scripts/investigate-data-flow.js         # Investigate data flow
```

## QMS Compliance Checklist

When working with tasks, ensure:
- [ ] DomainTasks have `masterTaskSnapshot` field
- [ ] UserTasks have `executionData` in snapshot
- [ ] TaskExecutions use ONLY snapshot data
- [ ] No dynamic fetching from parent collections
- [ ] All new tasks marked as `isQMSCompliant: true`

## External Dependencies

- **@forus/ui**: Local UI component library (../../packages/forus-ui)
- **@chatscope/chat-ui-kit-react**: Chat UI components
- **AI Providers**: Requires GEMINI_API_KEY or OPENAI_API_KEY in environment

## Key Documentation

For detailed documentation, see the `/documentation` folder:
- [Architecture Overview](./documentation/architecture/PROJECT_STRUCTURE_ANALYSIS.md)
- [Codebase Index](./documentation/architecture/CODEBASE_INDEX.md)
- [Navigation & Routing](./documentation/architecture/NAVIGATION_AND_ROUTING.md)
- [Technical Debt Register](./documentation/reports/TECHNICAL_DEBT_REGISTER.md)
- [Camunda Integration Plan](./documentation/architecture/CAMUNDA_INTEGRATION_PLAN.md)
- [Camunda Tasklist Full Implementation](./documentation/planning/CAMUNDA_TASKLIST_FULL_IMPLEMENTATION_PLAN.md)
- [NetBuild + Camunda Stack](./documentation/architecture/NETBUILD_CAMUNDA_STACK.md)
- [Keycloak Integration Guide](./documentation/architecture/KEYCLOAK_INTEGRATION_GUIDE.md)