# MCP Camunda Integration for NetBuild

## Overview

The MCP Camunda server (https://github.com/lepoco/mcp-camunda) provides an "Agentic Gateway" that allows AI agents to directly interact with Camunda 7. This significantly simplifies the integration between FORUS Cortex agents and the Camunda workflow engine.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FORUS Cortex Agent                           │
├─────────────────────────────────────────────────────────────────┤
│                      MCP Client Layer                            │
├─────────────────┬────────────────────┬─────────────────────────┤
│  MCP MongoDB    │   MCP Camunda      │    MCP Custom Tools     │
│   (Existing)    │    (New)           │     (NetBuild)          │
├─────────────────┴────────────────────┴─────────────────────────┤
│                    Unified Tool Interface                        │
└─────────────────────────────────────────────────────────────────┘
```

## Available MCP Camunda Tools

### Process Management
```typescript
// List all deployed process definitions
const processes = await agent.use_mcp_tool(
  'camunda', 
  'mcp-camunda-list-process-definitions',
  {}
);

// Count active process instances
const count = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-count-process-instances',
  { state: 'active' }
);

// List process instances for a specific definition
const instances = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-list-process-instances',
  { 
    processDefinitionKey: 'invoice-processing',
    tenantId: domainId // NetBuild domain as Camunda tenant
  }
);
```

### Task Management
```typescript
// List user tasks for assignment
const tasks = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-list-user-tasks',
  {
    unassigned: true,
    tenantId: domainId
  }
);

// Count tasks by assignee
const taskCount = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-count-user-tasks',
  {
    assignee: userId
  }
);
```

### Variable Management
```typescript
// List all variables for a process instance
const variables = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-list-variables',
  {
    processInstanceId: instanceId
  }
);

// Get specific variable value
const invoiceAmount = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-list-variables',
  {
    processInstanceId: instanceId,
    variableName: 'invoiceAmount'
  }
);
```

### Incident Handling
```typescript
// List all incidents (errors)
const incidents = await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-list-incidents',
  {
    tenantId: domainId
  }
);

// Resolve an incident
await agent.use_mcp_tool(
  'camunda',
  'mcp-camunda-resolve-incident',
  {
    incidentId: incident.id
  }
);
```

## Integration with NetBuild

### 1. Agent Prompts for Workflow Management

```typescript
// Workflow monitoring agent prompt
const workflowMonitorPrompt = `You are a workflow monitoring specialist for NetBuild.

Available tools:
- mcp-camunda-list-process-instances: Check running workflows
- mcp-camunda-list-incidents: Find workflow errors
- mcp-camunda-resolve-incident: Fix workflow issues
- mcp-camunda-list-user-tasks: Find tasks needing attention

Your responsibilities:
1. Monitor all active workflows in the domain
2. Detect stuck processes or overdue tasks
3. Automatically resolve known issues
4. Escalate complex problems to humans
5. Provide workflow health summaries

Current domain: ${domainId}
Check workflows every 30 seconds and report issues.`;
```

### 2. Task Assignment Agent

```typescript
// Intelligent task assignment
const taskAssignmentPrompt = `You are a task assignment specialist.

Use these tools to manage task distribution:
- mcp-camunda-list-user-tasks: Find unassigned tasks
- mcp__mongodb__find: Query user skills and availability
- mcp-camunda-complete-task: Assign tasks to users

Assignment logic:
1. Match task requirements with user skills
2. Consider current workload (count assigned tasks)
3. Respect user availability and timezone
4. Ensure balanced distribution
5. Prioritize urgent tasks

For each unassigned task:
1. Analyze required skills from task variables
2. Find best matching available user
3. Assign and notify via WebSocket`;
```

### 3. Process Optimization Agent

```typescript
// Process performance analyzer
const optimizationPrompt = `You are a process optimization expert.

Analyze workflow performance using:
- mcp-camunda-list-process-instances: Get execution data
- mcp-camunda-list-variables: Analyze process metrics
- mcp__mongodb__aggregate: Calculate performance stats

Look for:
1. Bottlenecks (tasks taking too long)
2. High failure rates (many incidents)
3. Unbalanced workload distribution
4. Repeated manual interventions
5. Opportunities for automation

Generate optimization reports with:
- Average completion times by process
- Task duration heatmaps
- Incident patterns
- Automation recommendations`;
```

## WebSocket Integration

Extend MCP Camunda with real-time event publishing:

```typescript
// Enhanced MCP Camunda wrapper
class RealtimeCamundaMCP {
  constructor(
    private mcpClient: MCPClient,
    private wsGateway: WebSocketGateway
  ) {}
  
  async listUserTasks(params: any) {
    // Call MCP tool
    const tasks = await this.mcpClient.callTool(
      'camunda',
      'mcp-camunda-list-user-tasks',
      params
    );
    
    // Broadcast new tasks
    for (const task of tasks.new) {
      this.wsGateway.broadcastToDomain(
        params.tenantId,
        'task:created',
        task
      );
    }
    
    return tasks;
  }
  
  async resolveIncident(params: any) {
    // Resolve via MCP
    const result = await this.mcpClient.callTool(
      'camunda',
      'mcp-camunda-resolve-incident',
      params
    );
    
    // Notify affected users
    this.wsGateway.broadcastToProcess(
      result.processInstanceId,
      'incident:resolved',
      result
    );
    
    return result;
  }
}
```

## Configuration

### 1. MCP Configuration File
```json
// .mcp.json
{
  "mcpServers": {
    "camunda": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "netbuild_default",
        "mcp/camunda",
        "-e", "CAMUNDA_HOST=http://camunda:8080/engine-rest/"
      ]
    },
    "mongodb": {
      "command": "mcp-server-mongodb",
      "args": ["mongodb://mongodb:27017/netbuild"]
    }
  }
}
```

### 2. Environment Variables
```env
# MCP Camunda Configuration
MCP_CAMUNDA_MODE=Http
MCP_CAMUNDA_HOST=http://localhost:8080/engine-rest/
MCP_CAMUNDA_PORT=64623

# Enable MCP tools in Cortex
ENABLE_MCP_TOOLS=true
MCP_CONFIG_PATH=/app/.mcp/config.json
```

### 3. Docker Compose Integration
```yaml
services:
  mcp-camunda:
    build:
      context: https://github.com/lepoco/mcp-camunda.git
    environment:
      - MODE=${MCP_CAMUNDA_MODE:-Http}
      - CAMUNDA_HOST=http://camunda:8080/engine-rest/
    ports:
      - "${MCP_CAMUNDA_PORT:-64623}:8080"
    networks:
      - netbuild_default
```

## Benefits

1. **Direct Integration**: AI agents can query and control Camunda without custom APIs
2. **Standardized Interface**: MCP provides consistent tool interface
3. **Reduced Complexity**: No need for custom Camunda client implementation
4. **Real-time Monitoring**: Agents can continuously monitor workflow health
5. **Intelligent Automation**: AI can make decisions based on workflow state

## Usage Examples

### Example 1: Automated Incident Resolution
```typescript
const incidentResolver = new CortexAgent({
  prompt: `Monitor Camunda incidents and auto-resolve known issues.
  
  Common resolutions:
  - "Variable not found" → Set default value
  - "Service unavailable" → Retry after 30s
  - "User not found" → Assign to supervisor
  
  Use mcp-camunda-list-incidents every minute.
  For each incident, analyze the error and apply fix.`,
  
  tools: ['mcp-camunda-list-incidents', 'mcp-camunda-resolve-incident']
});
```

### Example 2: Workload Balancer
```typescript
const workloadBalancer = new CortexAgent({
  prompt: `Balance task assignments across team members.
  
  Every 5 minutes:
  1. Count tasks per user (mcp-camunda-count-user-tasks)
  2. Find overloaded users (>10 active tasks)
  3. Reassign lower-priority tasks
  4. Notify affected users via WebSocket`,
  
  tools: [
    'mcp-camunda-list-user-tasks',
    'mcp-camunda-count-user-tasks',
    'mcp__mongodb__find'
  ]
});
```

### Example 3: SLA Monitor
```typescript
const slaMonitor = new CortexAgent({
  prompt: `Monitor process SLAs and alert on violations.
  
  Check every minute:
  1. List all active process instances
  2. Calculate time since start
  3. Compare with SLA targets from process variables
  4. Alert if SLA at risk (80% of time elapsed)
  5. Escalate if SLA breached`,
  
  tools: [
    'mcp-camunda-list-process-instances',
    'mcp-camunda-list-variables'
  ]
});
```

## Next Steps

1. Build MCP Camunda Docker image
2. Configure MCP client in Cortex
3. Create specialized workflow agents
4. Implement WebSocket broadcasting
5. Test with sample BPMN processes