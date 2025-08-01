# NetBuild Codebase Index

## Table of Contents
1. [Core Architecture Overview](#core-architecture-overview)
2. [API Routes Map](#api-routes-map)
3. [Database Models](#database-models)
4. [React Components](#react-components)
5. [Services & Utilities](#services--utilities)
6. [Configuration & Scripts](#configuration--scripts)

## Core Architecture Overview

### Tech Stack
- **Framework**: Next.js 14.2.18 (App Router)
- **Language**: TypeScript
- **UI**: React 18.3.1, Tailwind CSS, @chatscope/chat-ui-kit-react
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based (access + refresh tokens)
- **Real-time**: Socket.io (workstream chat), SSE (AI streaming)
- **AI Integration**: Google Gemini, OpenAI GPT
- **Port**: 3001 (development)

### Three-Tier Data Architecture

NetBuild implements a QMS-compliant three-tier architecture for task management:

```
masterTasks → domainTasks → taskExecutions
(Templates)   (Domain Copies)  (User Assignments)
```

**Key Principles:**
- Each tier is a **separate MongoDB collection**
- Complete snapshots are stored at each level (no dynamic lookups)
- Immutable data ensures QMS compliance
- Full audit trail maintained through snapshots

### Authentication Flow

1. **JWT Token Management**:
   - Access tokens: 15 minutes expiry (localStorage + httpOnly cookie)
   - Refresh tokens: 7 days expiry (httpOnly cookie only)
   - Token rotation on refresh
   - Automatic refresh via middleware

2. **Domain Access Control**:
   - All domain resources require membership verification
   - Uses `verifyDomainAccess()` for API protection
   - Returns 403 for unauthorized access (no information leakage)

### Key Design Patterns

- **Domain-Driven Design**: Multi-domain platform with isolated contexts
- **Snapshot Pattern**: Complete data copies for QMS compliance
- **Service Layer**: Business logic separated from API routes
- **Context Providers**: React Context for state management
- **SSE Streaming**: Real-time AI responses with token tracking

## API Routes Map

### Authentication (`/api/auth/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/auth/login` | POST | User login with JWT tokens | No |
| `/api/auth/register` | POST | Create new user account | No |
| `/api/auth/refresh` | POST | Refresh access token | Refresh Token |
| `/api/auth/logout` | POST | Clear tokens and logout | Yes |

### Domain Management (`/api/domains/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/domains` | GET | List user's domains | Yes |
| `/api/domains` | POST | Create new domain | Yes |
| `/api/domains/[domainId]/users` | GET | List domain members | Yes + Domain |
| `/api/domains/[domainId]/adopt-task` | POST | Adopt MasterTask to domain | Yes + Admin |
| `/api/domains/[domainId]/master-tasks/[masterTaskId]` | GET | Get domain-scoped task | Yes + Domain |

### Task Management (`/api/domain-tasks/*`, `/api/master-tasks/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/domain-tasks` | GET | List domain's tasks | Yes + Domain |
| `/api/domain-tasks/master` | GET | Get available tasks | Yes + Domain |
| `/api/domain-tasks/assign` | POST | Self-assign task | Yes + Domain |
| `/api/domain-tasks/[taskId]` | GET | Get specific task | Yes + Domain |
| `/api/master-tasks/[masterTaskId]` | GET | Get master template | Yes |

### Task Execution (`/api/task-executions/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/task-executions` | GET | List user's executions | Yes |
| `/api/task-executions/recent` | GET | Recent executions | Yes |
| `/api/task-executions/[executionId]` | GET | Get execution details | Yes |
| `/api/task-executions/[executionId]/info` | GET | Execution info only | Yes |
| `/api/task-executions/[executionId]/messages` | GET | Get chat messages | Yes |

### Chat & AI (`/api/chat/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/chat/stream` | POST | SSE AI chat streaming | Yes |
| `/api/chat/start-task` | POST | Initialize task chat | Yes |

### Invitations (`/api/invites/*`)
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/invites` | GET | List domain invites | Yes + Domain |
| `/api/invites` | POST | Create invite link | Yes + Admin |
| `/api/invites/use` | POST | Use invite code | Yes |

### Other APIs
| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/keys` | GET/POST | API key management | Yes |
| `/api/files/upload` | POST | File upload handler | Yes |
| `/api/user/domains` | GET | User's domain list | Yes |
| `/api/workstreams` | GET/POST | Workstream management | Yes + Domain |
| `/api/workstreams/[id]/messages` | GET | Workstream messages | Yes + Member |

## Database Models

### User Model (`/app/models/User.ts`)
```typescript
{
  userId: string (unique)
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  identity: {
    isVerified: boolean
    verifiedAt: Date
    verificationType: string
  }
  domains: [{
    domain: ObjectId
    domainId: ObjectId  // Legacy field, check both
    role: ObjectId
    joinedAt: Date
  }]
  currentDomainId: ObjectId
  preferences: {
    theme: string
    language: string
    notifications: object
  }
}
```

### Domain Model (`/app/models/Domain.ts`)
```typescript
{
  domainId: string (unique)
  name: string
  slug: string (unique, URL-friendly)
  description: string
  industry: string
  metadata: {
    logoUrl: string
    primaryColor: string
    website: string
  }
  settings: {
    requireApproval: boolean
    allowedEmailDomains: string[]
  }
  roles: Role[]
  inviteCodes: InviteCode[]
}
```

### MasterTask Model (`/app/models/MasterTask.ts`)
```typescript
{
  masterTaskId: string (unique)
  name: string
  category: 'identity' | 'onboarding' | 'compliance' | 'training' | 'operational' | 'financial'
  executionModel: 'form' | 'sop' | 'knowledge' | 'bpmn' | 'training'
  currentStage: 'manual' | 'assisted' | 'supervised' | 'automated' | 'ai_promoted'
  taskType: string  // 'workstream_basic' for workstreams
  priority: 'urgent' | 'high' | 'normal' | 'low'
  standardOperatingProcedure: IStandardOperatingProcedure
  domain: string  // Empty string or null for templates
  isActive: boolean
  aiAgentAttached: boolean  // Controls AI features in UI
}
```

### DomainTask Model (`/app/models/DomainTask.ts`)
```typescript
{
  masterTaskId: string  // Reference to original
  domain: string  // Required - domain that adopted
  adoptedAt: Date
  adoptedBy: string
  
  // Complete snapshot from MasterTask
  name: string
  description: string
  category: string
  executionModel: string
  taskType: string
  standardOperatingProcedure: object
  
  // Domain customizations
  domainCustomizations: {
    title: string
    description: string
    systemPrompt: string
    reward: object
  }
  
  isActive: boolean
  metrics: {
    executionCount: number
    averageCompletionTime: number
    successRate: number
  }
}
```

### TaskExecution Model (`/app/models/TaskExecution.ts`)
```typescript
{
  executionId: string (unique)
  userId: ObjectId
  domainId: ObjectId
  domainTaskId: ObjectId
  
  taskSnapshot: any  // Complete DomainTask snapshot
  
  status: 'assigned' | 'in_progress' | 'completed' | 'failed'
  assignedAt: Date
  startedAt: Date
  completedAt: Date
  
  messages: ObjectId[]  // References to ExecutionMessage
  procedureStates: Map<number, string>  // For SOP tracking
  formData: Map<string, any>  // For form submissions
}
```

### ExecutionMessage Model (`/app/models/ExecutionMessage.ts`)
```typescript
{
  messageId: string (unique)
  executionId: string
  userId: ObjectId
  
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  content_parts: [{
    type: 'text' | 'image_url' | 'code' | 'file'
    // Type-specific fields
  }]
  
  model: string  // AI model used
  tokenCount: number
  promptTokens: number
  completionTokens: number
  
  parentMessageId: string  // For conversation threading
}
```

### Supporting Models
- **Invite** (`/app/models/Invite.ts`): Domain invitation links
- **Key** (`/app/models/Key.ts`): API key management
- **UnifiedTask** (`/app/models/UnifiedTask.ts`): Legacy model (being phased out)

## React Components

### Layout Components
- **AppLayout** (`app-layout.tsx`): Main application wrapper with sidebar
- **Sidebar** (`sidebar.tsx`): Navigation sidebar with domain context
- **SparkAppBar** (`spark-app-bar.tsx`): Top navigation bar
- **Providers** (`providers.tsx`): Context provider wrapper

### Authentication Components
- **LoginForm** (`login-form.tsx`): Login interface
- **ProtectedRoute** (`protected-route.tsx`): Route protection wrapper
- **UserProfile** (`user-profile.tsx`): User profile display

### Domain Components
- **DomainSelector** (`domain-selector.tsx`): Domain switcher
- **DomainCard** (`domain-card.tsx`): Domain display card
- **DomainGrid** (`domain-grid.tsx`): Domain listing grid
- **CreateDomainModal** (`create-domain-modal.tsx`): New domain creation
- **DomainJoinModal** (`domain-join-modal.tsx`): Join domain interface

### Task Components
- **TaskExecutions** (`task-executions.tsx`): Task execution list
- **ExecutionCard** (`execution-card.tsx`): Single execution display
- **ProcessCard** (`process-card.tsx`): Process/task card
- **DomainTasksDrawer** (`domain-tasks-drawer.tsx`): Task selection drawer
- **TaskSnapshotPopup** (`task-snapshot-popup.tsx`): View task data

### Chat Components
- **ChatInterfaceWrapper** (`chat-interface-wrapper.tsx`): Main chat container
- **WorkstreamChatInterface** (`workstream-chat-interface.tsx`): Workstream chat
- **SmartMessageDisplay** (`smart-message-display.tsx`): Message renderer
- **AttachmentMenu** (`attachment-menu.tsx`): File attachment UI

### Chatscope Components (`/components/chatscope/*`)
- **MessageAvatar**: User/AI avatars
- **MessageContent**: Content renderer
- **MessageFooter**: Timestamp, status
- **LinkPreview**: URL preview cards
- **AttachedFilesPreview**: File attachments

### Utility Components
- **Markdown** (`markdown.tsx`): Markdown renderer
- **CodeBlock** (`code-block.tsx`): Code syntax highlighting
- **FileUpload** (`file-upload.tsx`): File upload handler
- **ForusSpinner** (`forus-spinner.tsx`): Loading indicator
- **EmptyState** (`empty-state.tsx`): Empty state display

### Display Components
- **ArtifactDisplay** (`artifact-display.tsx`): Artifact viewer
- **StructuredDataDisplay** (`structured-data-display.tsx`): JSON viewer
- **ExtractedFieldsDisplay** (`extracted-fields-display.tsx`): Form data display
- **SOPPopup** (`sop-popup.tsx`): Standard Operating Procedure viewer

## Services & Utilities

### Core Services (`/app/services/*`)
- **TaskExecutionService** (`task-executions.ts`)
  - `createTaskExecution()`: Create new execution
  - `getTaskExecution()`: Retrieve by ID
  - `getUserTaskExecutions()`: List user's executions
  - `updateTaskExecution()`: Update status/data
  
- **DomainAdoptionService** (`domain-adoption.service.ts`)
  - `adoptMasterTask()`: Copy MasterTask to DomainTask
  - `validateAdoption()`: Check adoption permissions
  
- **WorkstreamService** (`workstream.service.ts`)
  - `createWorkstream()`: Initialize workstream
  - `addMember()`: Add workstream member
  - `getMessages()`: Retrieve chat messages

### Task Services (`/app/lib/services/*`)
- **TaskAssignmentService**: Handle task assignment flow
- **TaskCompletionService**: Manage task completion
- **TaskDisplayService**: Format tasks for UI
- **TaskInteractionService**: Handle user interactions
- **TaskJourneyService**: Track task progression

### Authentication (`/app/lib/auth/*`)
- **JWT Service** (`jwt.ts`)
  - `generateTokens()`: Create access/refresh tokens
  - `verifyAccessToken()`: Validate access token
  - `verifyRefreshToken()`: Validate refresh token
  
- **Domain Access** (`domain-access.ts`)
  - `verifyDomainAccess()`: Check domain membership
  - `createUnauthorizedResponse()`: Standard 403 response

### AI Integration (`/app/lib/ai/*`)
- **GeminiClient** (`gemini-client.ts`): Google Gemini integration
- **AI Prompts** (`ai-prompts.ts`): System prompt construction

### Utilities (`/app/lib/*`)
- **Database** (`database.ts`): MongoDB connection management
- **Utils** (`utils.ts`): General utility functions
- **URL Utils** (`url-utils.ts`): URL handling utilities
- **Chat Transformers** (`chat-transformers.ts`): Message formatting
- **File Config** (`file-config.ts`): File upload configuration

### React Hooks
- **useFileUpload** (`/app/hooks/use-file-upload.ts`): File upload hook
- **useWorkstreamMessages** (`/app/lib/hooks/use-workstream-messages.ts`): Real-time messages

### Context Providers (`/app/contexts/*`)
- **AuthContext**: JWT authentication state
- **DomainContext**: Current domain selection
- **ChatContext**: Chat session management
- **FileContext**: File upload handling

## Configuration & Scripts

### Environment Variables (`.env.local`)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/netbuild

# JWT Secrets
JWT_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character secret>
SESSION_SECRET=<32+ character secret>

# Encryption (for API keys)
CREDS_KEY=<32 character encryption key>
CREDS_IV=<16 character IV>

# AI Integration
OPENAI_API_KEY=<OpenAI API key>
GEMINI_API_KEY=<Google Gemini API key>
```

### Build Configuration
- **Next.js Config** (`next.config.js`): Next.js settings
- **TypeScript** (`tsconfig.json`): TypeScript configuration
- **Tailwind** (`tailwind.config.ts`): Tailwind CSS setup
- **PostCSS** (`postcss.config.js`): PostCSS plugins
- **ESLint** (`.eslintrc`): Code quality rules

### Development Scripts (`package.json`)
```bash
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript checking
```

### Database Scripts (`/scripts/*`)

#### Index Management
- **optimize-indexes.ts**: Create performance indexes
- **cleanup-old-indexes.ts**: Remove auto-generated names
- **create-named-indexes.ts**: Create readable index names
- **rename-indexes.ts**: Rename existing indexes

#### Data Management
- **create-read-memo-task.ts**: Create QMS-compliant task
- **add-workstream-master-task.ts**: Add workstream template
- **cleanup-workstream-tasks.ts**: Clean workstream data
- **verify-schema-consistency.ts**: Validate data integrity

### Server Configuration
- **Development** (`server-dev.js`): Development server with SSE support
- **Production** (`server.js`): Production server configuration

### VS Code Configuration
- **Launch Config** (`.vscode/launch.json`): Debug settings for port 3001
- **Workspace** (`forus.code-workspace`): Multi-root workspace

### MongoDB Indexes

Index naming convention: `idx_<purpose>`

Key indexes across collections:
- `idx_user_recent`: Recent items by user
- `idx_domain_active`: Active domain items
- `idx_email_unique`: Unique email constraint
- `idx_execution_lookup`: Fast execution lookup
- `idx_text_search`: Full-text search

See `/docs/database-indexes.md` for complete documentation.

### Documentation Files
- **CLAUDE.md**: AI assistant guidelines
- **PROJECT_STRUCTURE_ANALYSIS.md**: Architecture deep dive
- **USER_FLOW_DIAGRAM.md**: User journey maps
- **TECHNICAL_DEBT_REGISTER.md**: Known issues tracking
- **QMS_API_DOCUMENTATION.md**: API reference

### External Integrations
- **Yellow Card API** (`/yellow-card-api/*`): Payment integration docs
- **@chatscope/chat-ui-kit-react**: Chat UI components
- **@microlink/react**: Link preview generation
- **Socket.io**: Real-time workstream chat
- **SSE.js**: Server-sent events for AI streaming