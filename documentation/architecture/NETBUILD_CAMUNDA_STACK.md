# NetBuild + Camunda 7: Combined Technology Stack

## Overview

This document outlines the complete feature set and capabilities achieved by rebuilding NetBuild as a modern UI layer on top of Camunda 7. This architecture combines Camunda's enterprise-grade workflow engine with NetBuild's innovative chat interface and SMME focus.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                   NetBuild UI (Next.js 14)                       │
│  Chat Interface • Domain Management • Real-time Updates          │
├─────────────────────────────────────────────────────────────────┤
│                      API Gateway Layer                           │
│         Intelligent routing to appropriate Camunda service       │
├─────────────────────────────────────────────────────────────────┤
│     Camunda 7 Services          │        NetBuild Services      │
│  ┌──────────────────────────┐   │   ┌────────────────────────┐ │
│  │ • Process Engine         │   │   │ • WebSocket Server     │ │
│  │ • User Management        │   │   │ • AI Integration       │ │
│  │ • Task Management        │   │   │ • Chat Orchestration   │ │
│  │ • BPMN Execution         │   │   │ • Event Bridge         │ │
│  └──────────────────────────┘   │   └────────────────────────┘ │
├─────────────────────────────────┴───────────────────────────────┤
│                    PostgreSQL Database                           │
│         Unified storage for all workflow and app data            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Features from Camunda 7

### 1. User & Identity Management
- **Built-in user/group management** - No custom auth needed
- **LDAP/AD integration** - Enterprise directory support
- **Role-based access control** - Fine-grained permissions
- **Multi-tenancy** - Domain isolation via tenant IDs
- **Session management** - Secure, proven authentication

### 2. Process Engine Capabilities
- **BPMN 2.0 execution** - Industry-standard workflows
- **DMN decision tables** - Business rule automation
- **Process versioning** - Safe updates and rollbacks
- **Timer events** - Scheduled tasks and escalations
- **Error handling** - Boundary events and compensation

### 3. Task Management
- **Human task assignment** - User/group based routing
- **Task forms** - Dynamic form generation
- **Task delegation** - Reassignment capabilities
- **Due dates & reminders** - SLA management
- **Task variables** - Rich context passing

### 4. Monitoring & Operations
- **Cockpit UI** - Process monitoring (optional)
- **History service** - Complete audit trails
- **Metrics API** - Performance monitoring
- **Incident management** - Error tracking and resolution
- **REST API** - Full programmatic access

## NetBuild Enhancements

### 1. Chat-Based Interface
- **Conversational task execution** - Natural language interaction
- **Context preservation** - Chat history linked to processes
- **AI assistance** - GPT/Gemini integration per task
- **Rich message types** - Forms, approvals, payments in chat
- **Real-time streaming** - SSE for instant updates

### 2. Domain Management
- **Domain workspaces** - Isolated business environments
- **Invite codes** - Easy team onboarding
- **Custom branding** - Per-domain theming
- **Domain analytics** - Usage and performance metrics
- **Cross-domain templates** - Share best practices

### 3. SMME Optimizations
- **Shared infrastructure** - $1.30/month per small domain
- **Progressive scaling** - Upgrade to isolated engines
- **Pre-built workflows** - Industry-specific templates
- **Simplified UI** - Hide complexity, show value
- **Mobile-first design** - Work from anywhere

### 4. AI Integration
- **Task automation** - AI agents complete routine tasks
- **Smart routing** - ML-based task assignment
- **Process optimization** - Learn from execution patterns
- **Natural language processing** - Create tasks from chat
- **Predictive analytics** - Forecast bottlenecks

## Data Architecture

### Clean Separation Principle

NetBuild maintains complete separation from Camunda's schema:
- **Camunda tables (ACT_*)**: Remain untouched, accessed only via APIs
- **NetBuild tables**: Separate namespace with soft references to Camunda IDs
- **No foreign keys**: Avoid tight coupling to Camunda schema
- **Process variables**: Minimal usage, only for process decisions

### PostgreSQL Schema Organization

```sql
-- CAMUNDA CORE TABLES (Don't modify)
ACT_ID_USER              -- Users (accessed via API)
ACT_ID_GROUP             -- Groups (accessed via API)
ACT_ID_TENANT            -- Tenants (accessed via API)
ACT_RE_PROCDEF           -- Process Definitions
ACT_RU_EXECUTION         -- Runtime Executions
ACT_RU_TASK              -- Active Tasks
ACT_RU_VARIABLE          -- Process Variables
ACT_HI_PROCINST          -- Process History

-- NETBUILD TABLES (Our domain)
netbuild_domains         -- Domain configurations
  └─ tenant_id (VARCHAR)   -- Soft reference to ACT_ID_TENANT
netbuild_chat_messages   -- Chat history  
  └─ process_instance_id   -- Soft reference to ACT_HI_PROCINST
  └─ user_id              -- Soft reference to ACT_ID_USER
netbuild_user_preferences-- UI preferences
  └─ user_id              -- Soft reference to ACT_ID_USER
netbuild_audit_log       -- Compliance tracking
netbuild_metrics         -- Performance data
netbuild_engine_registry -- Multi-engine mapping

-- PROCESS VARIABLES (Minimal usage)
-- Only for process flow decisions:
- approvalRequired: boolean
- priority: 'high' | 'medium' | 'low'  
- escalationLevel: number
- deadlineDate: timestamp
-- NOT for application data storage
```

## Key Integration Points

### 1. Authentication Flow
```typescript
// NetBuild UI → Camunda Auth
login(username, password) → Camunda REST API → Session
getCurrentUser() → User + Groups + Tenant memberships
authorize(resource) → Camunda Authorization Service
```

### 2. Process Execution
```typescript
// Start process with minimal variables
const processInstance = await startProcess({
  processDefinitionKey: 'invoice-approval',
  tenantId: domainId,
  variables: {
    initiatedBy: userId,
    priority: 'high',
    approvalRequired: true
  }
});

// Store chat context in NetBuild tables
await saveChatContext({
  processInstanceId: processInstance.id,
  messages: chatHistory,
  domainId: domainId
});
```

### 3. Task Handling
```typescript
// Task appears in chat
onTaskCreated → Convert to chat message
onFormRequired → Render inline form
onApprovalNeeded → Show approve/reject buttons
onTaskCompleted → Update chat with outcome
```

### 4. Real-time Updates
```sql
-- PostgreSQL NOTIFY for events
NOTIFY camunda_events, '{"type": "task-created", "taskId": "123"}';

-- WebSocket broadcast
socket.to(domainRoom).emit('task-update', taskData);
```

## Deployment Models

### 1. Shared Engine (Default)
- Single Camunda instance
- Tenant isolation via IDs
- Shared PostgreSQL database
- Perfect for SMMEs
- Cost: ~$130/month for 100+ domains

### 2. Isolated Engine (Enterprise)
- Dedicated Camunda instance
- Separate schema or database
- Custom configurations
- For high-volume domains
- Cost: +$50-100/month per domain

### 3. Hybrid Approach
- API Gateway routes by domain
- Transparent to end users
- Dynamic provisioning
- Gradual migration path

## Security & Compliance

### From Camunda
- SQL-level authorization enforcement
- Audit logging built-in
- Process history immutable
- User/group permissions
- Secure session handling

### From NetBuild
- Domain isolation
- Chat encryption
- GDPR compliance tools
- Data retention policies
- IP-based access control

## Performance Optimizations

### Database
- JSONB indexes for fast queries
- Partitioned chat tables
- Connection pooling
- Read replicas for analytics

### Application
- Process variable caching
- Lazy loading of history
- WebSocket connection pooling
- CDN for static assets

### Scaling
- Horizontal scaling of UI
- Camunda clustering support
- Database sharding ready
- Microservices architecture

## Migration Benefits

### Before (Standalone NetBuild)
- Custom user management
- Custom authentication
- Custom authorization
- MongoDB + JWT complexity
- Limited workflow features

### After (NetBuild on Camunda)
- Camunda user management
- Proven authentication
- Built-in authorization
- Single PostgreSQL database
- Full BPMN capabilities

## Cost Analysis

### Small Domain (Shared Engine)
- Infrastructure: $1.30/month
- Features: Full platform
- Users: Unlimited
- Processes: 1000/month
- Storage: 100MB

### Medium Domain (Shared Engine)
- Infrastructure: $5-10/month
- Features: Full platform
- Users: Unlimited
- Processes: 10,000/month
- Storage: 1GB

### Enterprise Domain (Isolated)
- Infrastructure: $100+/month
- Features: Full platform + custom
- Users: Unlimited
- Processes: Unlimited
- Storage: As needed

## Future Enhancements

### Phase 4: Cortex Integration
- AI agents with MCP tools
- Autonomous task completion
- Microservice generation
- Self-healing workflows

### Phase 5: Embedded Finance
- Stablecoin payments
- Smart contract escrow
- Invoice financing
- Cross-border settlements

### Phase 6: Self-Evolution
- ML-based optimization
- Cross-domain learning
- Automatic best practices
- Predictive operations

## Conclusion

The NetBuild + Camunda 7 stack combines:
- **Enterprise reliability** from Camunda's proven engine
- **Modern UX** from NetBuild's chat interface
- **SMME accessibility** through shared infrastructure
- **Future readiness** with AI and blockchain capabilities

This architecture delivers enterprise-grade workflow automation at a price point that makes it accessible to every business, regardless of size.