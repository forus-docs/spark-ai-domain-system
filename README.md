# Spark AI Domain System

## Overview
The Spark AI Domain System is a QMS-compliant, multi-role, multi-domain enterprise platform that enables users to join industry-specific ecosystems (domains), select roles, and access domain-specific features with AI-assisted task execution through immutable data snapshots.

## Current Status (January 2025)
- **QMS-compliant architecture** with immutable snapshot system
- **Production-ready** authentication system with JWT tokens
- **MongoDB** database integration for all data storage
- **Real-time chat** with Server-Sent Events (SSE)
- **Task Journey system** for personalized user experiences
- **SOP-driven AI context** for compliance and guidance
- **5 execution models** ready for process automation

## Quick Start

### Prerequisites
- Node.js 20.10.0+
- MongoDB 8.0+ running on port 27017
- VS Code with recommended extensions

### Environment Setup
Create `.env.local` with required variables (see CLAUDE.md)

### Development
```bash
# Install dependencies
npm install

# Start MongoDB (if not running)
mongod --dbpath ~/data/db --port 27017 &

# Run development server (port 3001)
npm run dev

# Run database migrations
npm run migrate:all

# Create QMS-compliant tasks (if needed)
node scripts/migrate-to-qms-compliant.js
```

## QMS-Compliant Architecture 🏛️

### Immutable Snapshot System
Data flows through complete, immutable snapshots ensuring consistency and audit trails:

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

**Key Benefits:**
- ✅ Changes require domain approval
- ✅ Running tasks cannot change mid-execution
- ✅ Complete audit trail for compliance
- ✅ Simplified architecture - all data in one place

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth
- **Real-time**: Server-Sent Events (SSE)

### Key Systems

#### Task Journey System
Creates personalized user experiences through:
- **MasterTasks**: Enterprise-wide task templates with SOPs
- **DomainTasks**: Domain-adopted tasks with complete snapshots
- **UserTasks**: User assignments with full execution data
- **TaskExecutions**: AI-assisted execution sessions

#### QMS Data Flow
1. **Domain Adoption**: Domain admins adopt MasterTasks, creating DomainTasks with complete data snapshots
2. **User Assignment**: Users self-assign DomainTasks, creating UserTasks with execution data
3. **Task Execution**: AI uses ONLY UserTask snapshot data - no dynamic fetching

#### SOP-Driven AI Context
AI assistants receive comprehensive Standard Operating Procedure context:
- Complete procedural steps with decision points
- Compliance requirements and regulations
- Role-based responsibilities
- Risk assessments and audit requirements
- Validation rules for data collection

#### 5 Execution Models
1. **Form**: Structured data collection
2. **SOP**: Standard Operating Procedures
3. **Knowledge**: Information retrieval
4. **BPMN**: Complex business workflows
5. **Training**: Educational processes

## Database Collections

### Core Collections (Renamed for Clarity)
- **users** - User accounts and authentication
- **domains** - Domain configurations
- **masterTasks** - Enterprise task templates with SOPs
- **domainTasks** - Domain-adopted tasks with snapshots
- **userTasks** - User task assignments with execution data
- **taskExecutions** - Active task execution sessions
- **executionMessages** - Chat messages within executions

### Collection Relationships
```
users ←→ domains (many-to-many membership)
  ↓
userTasks → domainTasks → masterTasks (snapshots, not references)
  ↓
taskExecutions → executionMessages
```

## API Endpoints

### Domain Task Management
- `POST /api/domains/[domainId]/adopt-task` - Adopt MasterTask with full snapshot
- `GET /api/domains/[domainId]/adopt-task` - List available tasks for adoption

### User Task Management
- `GET /api/domain-tasks` - Get domain tasks (assigned and unassigned)
- `POST /api/domain-tasks/assign` - Self-assign a domain task
- `POST /api/domain-tasks/[taskId]/task-execution` - Create execution session

### Task Execution
- `GET /api/task-executions` - List user's executions
- `GET /api/task-executions/[executionId]` - Get execution details
- `POST /api/chat/stream` - Stream AI responses

## Key Documentation

### Architecture & Design
- `PROJECT_STRUCTURE_ANALYSIS.md` - Complete system architecture
- `USER_FLOW_DIAGRAM.md` - Visual flow diagrams
- `docs/QMS_API_DOCUMENTATION.md` - QMS-compliant API reference
- `CLAUDE.md` - Development guidelines

### Technical Guides
- `TECHNICAL_DEBT_REGISTER.md` - Known issues and roadmap
- `docs/mongodb-admin-guide.md` - Database operations
- `scripts/README.md` - Migration documentation

## Development Tools

### MongoDB MCP Server
Direct database access through natural language:
- Configuration: `~/.claude/.mcp.json`
- Connection: `mongodb://localhost:27017/spark-ai`
- Tools prefix: `mcp__mongodb__`

### VS Code Debug
- Configuration: `.vscode/launch.json`
- Port: 3001
- Full-stack debugging with breakpoints

### Linting & Building
```bash
npm run lint        # ESLint check
npm run build       # Production build
npm run typecheck   # TypeScript validation
```

## QMS Compliance Checklist

When working with tasks, ensure:
- [ ] DomainTasks have `masterTaskSnapshot` field
- [ ] UserTasks have `executionData` in snapshot
- [ ] TaskExecutions use ONLY snapshot data
- [ ] No dynamic fetching from parent collections
- [ ] All new tasks marked as `isQMSCompliant: true`

## Design Philosophy
- **QMS First**: Immutable snapshots for audit trails
- **User Initiated**: No automatic task assignment
- **Clean UI**: Minimalist with generous whitespace
- **Mobile First**: Responsive design patterns
- **Type Safe**: Full TypeScript coverage

## Migration Scripts

### QMS Compliance
```bash
# Create QMS-compliant tasks from existing data
node scripts/migrate-to-qms-compliant.js

# Clean up non-compliant tasks (after verification)
node scripts/cleanup-non-compliant-tasks.js
```

### Database Maintenance
```bash
# Rename collections (if needed)
node scripts/rename-collections.js

# Investigate data flow
node scripts/investigate-data-flow.js
```

## Historical Reference
For Sprint documentation and historical specifications, see the `/archive/` directory.

---

For detailed information, refer to the documentation files listed above.