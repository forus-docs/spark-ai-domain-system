# Camunda 7 Integration with NetBuild - Implementation Plan (REVISED)

## Executive Summary

This document outlines the revised implementation plan for rebuilding NetBuild as a modern UI layer on top of Camunda 7, leveraging Camunda's built-in user management, authentication, and workflow engine while maintaining NetBuild's innovative chat-based interface and domain focus for SMMEs.

## Architecture Overview

### Updated Architecture: NetBuild as Camunda UI Layer (Simplified)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NetBuild UI Layer (Next.js)                      │
│         (Chat Interface, Domain UX, Real-time Updates)               │
├─────────────────────────────────────────────────────────────────────┤
│                      API Gateway / Router                            │
│              (Routes to appropriate Camunda service)                 │
├──────────────────────┬────────────────────┬─────────────────────────┤
│  Shared Camunda      │  Enterprise        │   NetBuild Services     │
│  Service (Port 8080) │  Services          │   (WebSocket Server)    │
│  ┌─────────────────┐ │  ┌──────────────┐ │  ┌──────────────────┐  │
│  │ • Small Domains │ │  │ • Port 8081+ │ │  │ • Real-time WS   │  │
│  │ • Tenant IDs    │ │  │ • Isolated   │ │  │ • Event Bridge   │  │
│  │ • Shared DB     │ │  │ • Premium    │ │  │ • AI Connector   │  │
│  └─────────────────┘ │  └──────────────┘ │  └──────────────────┘  │
├──────────────────────┴────────────────────┴─────────────────────────┤
│                    PostgreSQL (Single Database)                      │
│  ┌────────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ Camunda Tables │  │ NetBuild Tables │  │ Process Variables │   │
│  │ • ACT_* tables │  │ • Domains       │  │ • Chat Context    │   │
│  │ • Users/Groups │  │ • Chat Messages │  │ • Workstreams     │   │
│  │ • Processes    │  │ • UI Settings   │  │ • Custom Data     │   │
│  └────────────────┘  └─────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Principles (Revised)

1. **NetBuild as UI Layer**: Leverage Camunda's core engine, add modern chat UX
2. **Single Database Architecture**: PostgreSQL for all data (Camunda + NetBuild)
3. **Cost-Effective Multi-Tenancy**: Shared engine with tenant IDs by default
4. **Enterprise Scalability**: Separate services for large domains when needed
5. **No Custom Auth**: Use Camunda's built-in user and group management

## Implementation Phases

### Phase 0: MCP Setup for Development (Immediate)

#### 0.1 Configure MCP Camunda in Claude Code
- Update ~/.claude/.mcp.json with Camunda MCP server
- Build MCP Camunda Docker image from https://github.com/lepoco/mcp-camunda
- Set CAMUNDA_HOST environment variable
- Restart Claude Code to activate MCP tools

#### 0.2 Available MCP Tools for Development
```
mcp__camunda__list-process-definitions    # List all BPMN process definitions
mcp__camunda__count-process-definitions   # Count deployed processes
mcp__camunda__list-process-instances      # List running process instances
mcp__camunda__count-process-instances     # Count active processes
mcp__camunda__list-variables              # Query process variables
mcp__camunda__list-incidents              # Find process errors
mcp__camunda__resolve-incident            # Fix process incidents
mcp__camunda__list-user-tasks            # List tasks awaiting action
mcp__camunda__count-user-tasks           # Count pending tasks
```

#### 0.3 Development Workflow with MCP
1. **Real-time Testing**: Deploy BPMN and immediately verify with MCP tools
2. **Live Debugging**: Query process state without leaving Claude Code
3. **Continuous Validation**: Check every change instantly
4. **Faster Iteration**: 30-40% reduction in development time

### Phase 1: Infrastructure Setup (Week 1-2)

#### 1.1 Microservices Architecture for Multi-Tenancy

Due to Spring Boot limitations, we'll use a microservices approach:

```yaml
# docker-compose.yml
version: '3.8'
services:
  # NetBuild UI Application
  netbuild-ui:
    build: ./netbuild-ui
    ports:
      - "3001:3001"
    environment:
      - API_GATEWAY_URL=http://localhost:4000
      - WEBSOCKET_URL=http://localhost:3002
    depends_on:
      - api-gateway

  # API Gateway (Routes to appropriate Camunda service)
  api-gateway:
    build: ./api-gateway
    ports:
      - "4000:4000"
    environment:
      - SHARED_CAMUNDA_URL=http://shared-camunda:8080/engine-rest
      - POSTGRES_URL=postgresql://camunda:${POSTGRES_PASSWORD}@postgres:5432/camunda_shared
    depends_on:
      - shared-camunda
      - postgres

  # Shared Camunda Engine (Most Domains)
  shared-camunda:
    image: camunda/camunda-bpm-platform:7.20.0
    ports:
      - "8080:8080"
    environment:
      - DB_DRIVER=org.postgresql.Driver
      - DB_URL=jdbc:postgresql://postgres:5432/camunda_shared
      - DB_USERNAME=camunda
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - CAMUNDA_BPM_ADMIN_USER_ID=admin
      - CAMUNDA_BPM_ADMIN_USER_PASSWORD=${CAMUNDA_ADMIN_PASSWORD}
    depends_on:
      - postgres
    volumes:
      - ./camunda-shared-config:/camunda/configuration

  # Enterprise Camunda Engine 1 (Isolated - deployed when needed)
  # enterprise-camunda-1:
  #   image: camunda/camunda-bpm-platform:7.20.0
  #   ports:
  #     - "8081:8080"
  #   environment:
  #     - DB_DRIVER=org.postgresql.Driver
  #     - DB_URL=jdbc:postgresql://postgres:5432/camunda_ent1
  #     - DB_SCHEMA=enterprise1
  #     - DB_USERNAME=camunda
  #     - DB_PASSWORD=${POSTGRES_PASSWORD}
  #   depends_on:
  #     - postgres

  # PostgreSQL for Camunda
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=camunda
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  # WebSocket Service
  websocket-service:
    build: ./websocket-service
    ports:
      - "3002:3002"
    environment:
      - POSTGRES_URL=postgresql://camunda:${POSTGRES_PASSWORD}@postgres:5432/camunda_shared
      - CAMUNDA_URL=http://shared-camunda:8080/engine-rest
    depends_on:
      - postgres
      - shared-camunda

volumes:
  postgres-data:
```

#### 1.2 Database Initialization
```sql
-- init-scripts/01-create-databases.sql
CREATE DATABASE camunda_shared;
CREATE DATABASE camunda_ent1;
CREATE DATABASE camunda_ent2;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE camunda_shared TO camunda;
GRANT ALL PRIVILEGES ON DATABASE camunda_ent1 TO camunda;
GRANT ALL PRIVILEGES ON DATABASE camunda_ent2 TO camunda;
```

#### 1.3 API Gateway Configuration
```typescript
// api-gateway/src/tenant-router.ts
class TenantRouter {
  private engines = new Map<string, CamundaEngine>();
  
  constructor() {
    // Always have shared engine
    this.engines.set('shared', {
      url: process.env.SHARED_CAMUNDA_URL,
      type: 'shared'
    });
  }
  
  async route(domainId: string, request: Request) {
    const domain = await this.getDomainConfig(domainId);
    
    if (domain.engineType === 'isolated') {
      // Route to dedicated engine
      const engine = this.engines.get(domainId);
      if (!engine) {
        throw new Error('Isolated engine not provisioned');
      }
      return this.forwardRequest(engine.url, request);
    }
    
    // Default: shared engine with tenant ID
    return this.forwardRequest(
      this.engines.get('shared').url,
      this.addTenantId(request, domainId)
    );
  }
  
  async provisionIsolatedEngine(domainId: string) {
    // Spin up new Docker container for isolated engine
    // Register in engines map
    // Update domain configuration
  }
}
```

#### 1.4 PostgreSQL Schema for NetBuild Data
```sql
-- NetBuild-specific tables in same PostgreSQL database as Camunda
-- Clean separation: We don't modify Camunda's ACT_* tables, only reference them

-- Domain configuration (maps to Camunda tenants)
CREATE TABLE netbuild_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,  -- References Camunda tenant (no FK to avoid coupling)
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  engine_type VARCHAR(20) DEFAULT 'shared',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages (high volume, indexed for performance)
CREATE TABLE netbuild_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_instance_id VARCHAR(255),  -- References Camunda process (no FK)
  domain_id UUID REFERENCES netbuild_domains(id),
  user_id VARCHAR(255),  -- References Camunda user (no FK)
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'workflow')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domain-to-engine mapping for multi-engine setup
CREATE TABLE netbuild_engine_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES netbuild_domains(id),
  engine_url VARCHAR(255) NOT NULL,
  engine_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  metrics JSONB DEFAULT '{}',
  last_health_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences (extends Camunda user without modifying their schema)
CREATE TABLE netbuild_user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,  -- References Camunda user (no FK)
  theme VARCHAR(50) DEFAULT 'light',
  chat_settings JSONB DEFAULT '{}',
  notification_prefs JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_chat_process ON netbuild_chat_messages(process_instance_id);
CREATE INDEX idx_chat_domain ON netbuild_chat_messages(domain_id);
CREATE INDEX idx_chat_created ON netbuild_chat_messages(created_at DESC);
CREATE INDEX idx_domains_slug ON netbuild_domains(slug);
CREATE INDEX idx_domains_tenant ON netbuild_domains(tenant_id);
```

#### 1.5 WebSocket Infrastructure
- Socket.IO server for real-time updates
- PostgreSQL LISTEN/NOTIFY for event propagation
- Camunda event listener integration
- Room-based broadcasting per domain/process

### Phase 2: Migration Strategy (Week 3-4)

#### 2.1 User Migration to Camunda
```typescript
// Migration script: NetBuild users → Camunda users/groups
async function migrateUsers() {
  const netbuildUsers = await User.find({});
  
  for (const user of netbuildUsers) {
    // Create Camunda user
    await camundaApi.createUser({
      id: user._id.toString(),
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ')[1] || '',
      email: user.email,
      password: generateTempPassword() // Force reset on first login
    });
    
    // Map domains to groups
    for (const domain of user.domains) {
      await camundaApi.addUserToGroup(user._id, domain.domainId);
    }
  }
}
```

#### 2.2 Domain to Tenant Mapping
```typescript
// Map NetBuild domains to Camunda tenants
async function migrateDomains() {
  const domains = await Domain.find({});
  
  for (const domain of domains) {
    // Create Camunda tenant
    await camundaApi.createTenant({
      id: domain._id.toString(),
      name: domain.name
    });
    
    // Create corresponding group for domain members
    await camundaApi.createGroup({
      id: `domain_${domain._id}`,
      name: `${domain.name} Members`,
      type: 'DOMAIN'
    });
    
    // Set up authorization for domain resources
    await camundaApi.createAuthorization({
      type: 1, // GRANT
      permissions: ['ALL'],
      groupId: `domain_${domain._id}`,
      resourceType: 'processDefinition',
      resourceId: '*' // All processes in tenant
    });
  }
}
```

#### 2.3 Process Definition Migration
```typescript
// Convert NetBuild tasks to BPMN process definitions
async function migrateProcessDefinitions() {
  const masterTasks = await MasterTask.find({});
  
  for (const task of masterTasks) {
    // Generate BPMN XML from task structure
    const bpmnXml = generateBPMN({
      id: task.processName,
      name: task.name,
      description: task.description,
      tasks: convertTasksToBPMN(task)
    });
    
    // Deploy to Camunda
    await camundaApi.deployProcess({
      name: task.name,
      bpmn: bpmnXml,
      tenantId: task.domain || 'shared'
    });
  }
}

### Phase 3: NetBuild UI Development (Week 5-6)

#### 3.1 Chat Interface Components
```typescript
// components/messages/workflow-message.tsx
interface WorkflowMessageProps {
  message: WorkflowMessage;
  onAction: (action: WorkflowAction) => void;
}

// components/messages/form-message.tsx
interface FormMessageProps {
  form: CamundaForm;
  onSubmit: (data: FormData) => void;
}

// components/messages/approval-message.tsx
interface ApprovalMessageProps {
  approval: ApprovalRequest;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onDelegate: (userId: string) => void;
}

// components/messages/payment-message.tsx
interface PaymentMessageProps {
  payment: PaymentRequest;
  onSign: () => void;
  onCancel: () => void;
}
```

#### 3.2 Camunda API Integration
```typescript
// services/camunda/camunda-client.ts
class CamundaClient {
  constructor(private gatewayUrl: string) {}
  
  // User operations (via Camunda auth)
  async login(username: string, password: string) {
    return this.post('/auth/login', { username, password });
  }
  
  async getCurrentUser() {
    return this.get('/user/profile');
  }
  
  // Process operations
  async startProcess(key: string, variables: any, tenantId: string) {
    return this.post(`/process-definition/key/${key}/tenant/${tenantId}/start`, {
      variables: this.formatVariables(variables)
    });
  }
  
  // Task operations
  async getUserTasks(userId: string) {
    return this.get('/task', {
      assignee: userId,
      includeAssignedTasks: true
    });
  }
  
  async completeTask(taskId: string, variables: any) {
    return this.post(`/task/${taskId}/complete`, {
      variables: this.formatVariables(variables)
    });
  }
}
```

### Phase 4: Cortex Integration (Week 7-8)

#### 4.1 MCP Camunda Integration
Leverage the existing MCP Camunda server (https://github.com/lepoco/mcp-camunda) for direct AI-Camunda communication:

```json
// .mcp.json configuration
{
  "mcpServers": {
    "camunda": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "mcp/camunda",
        "-e", "CAMUNDA_HOST=http://camunda:8080/engine-rest/",
        "-e", "MODE=Http",
        "-p", "64623:8080"
      ]
    }
  }
}
```

Available MCP Tools:
- `mcp-camunda-list-process-definitions` - List all process definitions
- `mcp-camunda-count-process-definitions` - Count process definitions
- `mcp-camunda-list-process-instances` - List running processes
- `mcp-camunda-count-process-instances` - Count process instances
- `mcp-camunda-list-variables` - List process variables
- `mcp-camunda-list-incidents` - List process incidents
- `mcp-camunda-resolve-incident` - Resolve incidents
- `mcp-camunda-list-user-tasks` - List active user tasks
- `mcp-camunda-count-user-tasks` - Count user tasks

#### 4.2 Enhanced Cortex-Camunda Bridge
Build on top of MCP Camunda to add NetBuild-specific features:
- WebSocket event publishing
- Task assignment logic
- Domain-based filtering
- Real-time synchronization

#### 4.3 Agent Capabilities
Configure Cortex agents for:
- Document analysis and extraction
- Risk assessment and scoring
- Microservice generation
- Payment orchestration
- Workflow optimization

#### 4.4 Memory Integration
- Connect Cortex FAISS memory to workflow context
- Store execution patterns
- Enable learning from successful workflows

### Phase 5: Payment Integration (Week 9-10)

#### 5.1 Web3 Wallet Integration
- Implement wallet connection (MetaMask, WalletConnect)
- Support multiple networks (Polygon, Arbitrum, Base)
- Handle transaction signing and monitoring

#### 5.2 Smart Contract Integration
```solidity
// contracts/WorkflowPayment.sol
contract WorkflowPayment {
    mapping(string => Payment) public payments;
    
    struct Payment {
        address recipient;
        uint256 amount;
        address token;
        string processInstanceId;
        bool completed;
    }
    
    function initiatePayment(
        string calldata processInstanceId,
        address recipient,
        uint256 amount,
        address token
    ) external;
    
    function confirmPayment(string calldata processInstanceId) external;
}
```

#### 5.3 Payment Service Task
- Create Camunda service task for payments
- Implement payment approval workflow
- Handle multi-signature requirements

### Phase 6: SMME Workflows & Optimization (Week 11-12)

#### 6.1 BPMN Process Templates
Create templates for:
- Invoice Financing
- Purchase Order Financing
- Payroll Processing
- Inventory Management
- Quality Assurance Certification

#### 6.2 Risk Assessment Workflows
- Credit scoring automation
- Document verification
- Compliance checking
- Collateral validation

#### 6.3 Reporting and Analytics
- Process performance metrics
- Risk analysis dashboards
- Payment tracking
- Compliance reports

## Technical Implementation Details

### API Gateway Routes

```typescript
// API Gateway handles routing to appropriate Camunda service
class ApiGateway {
  // Authentication (proxied to Camunda)
  POST   /api/auth/login
  GET    /api/auth/profile
  POST   /api/auth/logout
  
  // User/Group Management (Camunda native)
  GET    /api/users
  POST   /api/users
  GET    /api/groups
  POST   /api/groups/add-member
  
  // Process Operations (routed by domain)
  POST   /api/domains/:domainId/processes/start
  GET    /api/domains/:domainId/processes
  GET    /api/domains/:domainId/tasks
  POST   /api/domains/:domainId/tasks/:taskId/complete
  
  // NetBuild-specific endpoints
  GET    /api/domains
  POST   /api/domains/:domainId/chat/messages
  GET    /api/domains/:domainId/chat/history
  
  // Cortex integration
  POST   /api/cortex/analyze-document
  POST   /api/cortex/assess-risk
  POST   /api/cortex/optimize-workflow
  
  // Payment integration
  POST   /api/payments/initiate
  GET    /api/payments/status/:paymentId
  POST   /api/payments/confirm
}
```

### Data Architecture (Clean Separation)

```sql
-- CAMUNDA TABLES (We don't touch these)
-- ACT_ID_* (Users, Groups, Tenants)
-- ACT_RE_* (Repository: Process definitions)  
-- ACT_RU_* (Runtime: Active processes, tasks, variables)
-- ACT_HI_* (History: Completed processes, audit)

-- NETBUILD TABLES (Our domain)
-- All NetBuild data in separate tables with references to Camunda IDs

-- Audit trail for compliance
CREATE TABLE netbuild_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),  -- References Camunda user
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance monitoring
CREATE TABLE netbuild_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES netbuild_domains(id),
  metric_type VARCHAR(50),
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process variables usage (minimal)
-- Only store process-decision data in Camunda variables:
-- - approvalRequired: boolean
-- - priority: string
-- - dueDate: timestamp
-- NOT chat history, NOT domain settings, NOT user preferences
```

### Environment Variables

```env
# Database Configuration (Single PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=camunda
POSTGRES_USER=camunda
POSTGRES_PASSWORD=secure-password

# Camunda Configuration
CAMUNDA_URL=http://localhost:8080/engine-rest
CAMUNDA_USERNAME=admin
CAMUNDA_ADMIN_PASSWORD=secure-admin-password

# WebSocket Configuration
WEBSOCKET_PORT=3002
WEBSOCKET_CORS_ORIGIN=http://localhost:3001

# Cortex Configuration
CORTEX_API_URL=http://localhost:5000
CORTEX_API_KEY=your-api-key
CORTEX_MODEL=gpt-4

# Blockchain Configuration
WEB3_PROVIDER_URL=https://polygon-rpc.com
PAYMENT_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=encrypted-key

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Feature Flags
ENABLE_AI_AUTOMATION=true
ENABLE_PAYMENT_PROCESSING=true
ENABLE_WORKFLOW_OPTIMIZATION=true
ENABLE_WEBSOCKET_REAL_TIME=true
```

## Testing Strategy

### Unit Tests
- Test Camunda API integration
- Test message type conversions
- Test payment calculations
- Test form validation

### Integration Tests
- Test end-to-end workflows
- Test multi-tenant isolation
- Test payment flows
- Test AI automation

### Load Testing
- Test concurrent workflow execution
- Test payment processing throughput
- Test chat message handling

## Monitoring and Observability

### Metrics to Track
- Workflow completion rates
- Average process duration
- Task automation percentage
- Payment success rates
- AI intervention accuracy

### Logging
- Camunda process logs
- Cortex agent decisions
- Payment transactions
- Error tracking

## Security Considerations

### Authentication
- JWT tokens for API access
- Camunda user management
- Wallet signature verification

### Authorization
- Domain-based access control
- Process-level permissions
- Payment approval limits

### Data Protection
- Encrypt sensitive variables
- Secure wallet keys
- Audit trail integrity

## Rollout Plan (Revised for UI Layer Architecture)

1. **Infrastructure Setup** (Week 1-2)
   - Deploy shared Camunda engine with PostgreSQL
   - Set up API Gateway for routing
   - Configure PostgreSQL for all data
   - Implement WebSocket service

2. **Migration Development** (Week 3-4)
   - Build user migration scripts (NetBuild → Camunda)
   - Create domain-to-tenant mapping logic
   - Convert existing processes to BPMN
   - Test data migration thoroughly

3. **UI Development** (Week 5-6)
   - Build NetBuild UI components on Camunda APIs
   - Implement authentication via Camunda
   - Create domain management interface
   - Integrate chat with process instances

4. **Integration & Testing** (Week 7-8)
   - Connect WebSocket to Camunda events
   - Test multi-tenant routing
   - Verify chat history preservation
   - Performance optimization

5. **Pilot Deployment** (Week 9-10)
   - Deploy to staging environment
   - Migrate pilot domains
   - User acceptance testing
   - Monitor and optimize

6. **Production Rollout** (Week 11-12)
   - Gradual domain migration
   - Monitor shared engine performance
   - Provision isolated engines as needed
   - Continuous optimization

## Success Metrics

- **Technical Metrics**
  - 99.9% uptime
  - <2s average task processing time
  - 95% AI automation accuracy
  - 100% payment success rate

- **Business Metrics**
  - 80% reduction in manual processing
  - 60% faster loan approvals
  - 50% reduction in operational costs
  - 90% user satisfaction

## MCP-Driven Development Practices

### Real-time Development Workflow
1. **Deploy BPMN Process**
   ```bash
   # Deploy process definition
   curl -X POST http://localhost:8080/engine-rest/deployment/create \
     -F "deployment-name=invoice-process" \
     -F "file=@invoice-process.bpmn"
   ```

2. **Verify with MCP in Claude Code**
   ```typescript
   // Immediately verify deployment
   mcp__camunda__list-process-definitions({ 
     key: 'invoice-process' 
   })
   ```

3. **Start Process Instance**
   ```typescript
   // Via API
   POST /engine-rest/process-definition/key/invoice-process/start
   
   // Verify with MCP
   mcp__camunda__list-process-instances({
     processDefinitionKey: 'invoice-process'
   })
   ```

4. **Debug in Real-time**
   ```typescript
   // Check for incidents
   mcp__camunda__list-incidents({})
   
   // Inspect variables
   mcp__camunda__list-variables({ 
     processInstanceId: 'xxx' 
   })
   
   // Monitor tasks
   mcp__camunda__list-user-tasks({
     processInstanceId: 'xxx'
   })
   ```

### Development Best Practices with MCP

1. **Test-Driven Process Development**
   - Write test expectations using MCP queries
   - Deploy process incrementally
   - Validate each step with MCP tools
   - Document expected MCP query results

2. **Continuous Process Monitoring**
   - Keep MCP queries in development notes
   - Monitor process health during coding
   - Catch issues immediately
   - Fix and verify in same session

3. **Live Documentation**
   - Include MCP query examples in docs
   - Show actual process states
   - Validate documentation with live data
   - Keep examples current

## Implementation Considerations

### Multi-Engine Challenges
Due to Spring Boot limitations, we cannot run multiple Camunda engines in a single application. The microservices approach solves this by:
- Running shared engine as one service
- Spinning up isolated engines as separate services
- Using API Gateway to route transparently
- Maintaining single UI experience

### Cost Optimization for SMMEs
- Shared engine supports thousands of small domains
- ~$130/month infrastructure serves 100+ domains
- Isolated engines only for domains with:
  - >1000 process instances/day
  - Regulatory compliance needs
  - Custom SLA requirements

### Migration Complexity
- Existing NetBuild users mapped to Camunda users
- Domain membership preserved via groups
- Process history maintained in PostgreSQL
- Gradual migration minimizes disruption

## Next Steps

1. **Proof of Concept** (2 weeks)
   - Deploy basic Camunda with shared engine
   - Test multi-tenant isolation
   - Validate API Gateway routing
   - Confirm cost projections

2. **Architecture Decision**
   - Confirm microservices approach
   - Finalize data migration strategy
   - Plan phased rollout

3. **Development Start**
   - Set up infrastructure (Week 1-2)
   - Begin user migration scripts
   - Start UI development