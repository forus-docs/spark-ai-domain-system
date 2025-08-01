# WebSocket Integration for NetBuild with Camunda

## Reality Check Assessment

**Can we achieve a reactive app with WebSockets and Camunda?**
**Answer: YES** - But we need to build a custom event bridge layer.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     NetBuild Clients                             │
│              (React App with WebSocket Client)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket Connection
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WebSocket Gateway Server                        │
│                    (Socket.IO / WS)                             │
├─────────────────────────────────────────────────────────────────┤
│                   Event Bridge Layer                             │
│  ├─ Camunda Event Listener (Task Lifecycle)                    │
│  ├─ Chat Message Handler                                        │
│  ├─ Cortex Agent Events                                        │
│  └─ Payment Status Updates                                     │
├─────────────────────────────────────────────────────────────────┤
│                    Service Layer                                 │
│  ├─ Camunda 7 Engine          ├─ NetBuild API                  │
│  ├─ External Task Workers     └─ MongoDB                       │
│  └─ Cortex Agents                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### 1. WebSocket Gateway Server

```typescript
// websocket/gateway.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { EventEmitter } from 'events';

export class WebSocketGateway extends EventEmitter {
  private io: Server;
  private roomManager: RoomManager;
  
  constructor(httpServer: any) {
    super();
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    // Redis adapter for horizontal scaling
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    this.io.adapter(createAdapter(pubClient, subClient));
    
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.io.on('connection', (socket) => {
      // Authentication
      const token = socket.handshake.auth.token;
      const { userId, domainId } = this.verifyToken(token);
      
      // Join rooms
      socket.join(`user:${userId}`);
      socket.join(`domain:${domainId}`);
      
      // Handle events
      socket.on('join-execution', (executionId) => {
        socket.join(`execution:${executionId}`);
      });
      
      socket.on('join-process', (processInstanceId) => {
        socket.join(`process:${processInstanceId}`);
      });
    });
  }
  
  // Broadcast methods
  broadcastToExecution(executionId: string, event: string, data: any) {
    this.io.to(`execution:${executionId}`).emit(event, data);
  }
  
  broadcastToProcess(processInstanceId: string, event: string, data: any) {
    this.io.to(`process:${processInstanceId}`).emit(event, data);
  }
  
  broadcastToDomain(domainId: string, event: string, data: any) {
    this.io.to(`domain:${domainId}`).emit(event, data);
  }
}
```

### 2. Camunda Event Bridge

```typescript
// services/camunda/event-bridge.ts
import { Client } from 'camunda-external-task-client-js';
import { WebSocketGateway } from '../websocket/gateway';

export class CamundaEventBridge {
  private camundaClient: Client;
  private wsGateway: WebSocketGateway;
  private pollingInterval: NodeJS.Timer;
  
  constructor(camundaUrl: string, wsGateway: WebSocketGateway) {
    this.camundaClient = new Client({ baseUrl: camundaUrl });
    this.wsGateway = wsGateway;
    this.setupEventListeners();
    this.startPolling();
  }
  
  private setupEventListeners() {
    // Task event worker - special topic for all task events
    this.camundaClient.subscribe('__task-event__', async ({ task, taskService }) => {
      const event = task.variables.get('event');
      const taskData = task.variables.get('taskData');
      
      // Broadcast to relevant rooms
      this.wsGateway.broadcastToProcess(
        task.processInstanceId,
        `task:${event}`,
        {
          taskId: taskData.id,
          taskName: taskData.name,
          assignee: taskData.assignee,
          created: taskData.created,
          processInstanceId: task.processInstanceId
        }
      );
      
      // Complete the event task
      await taskService.complete(task);
    });
  }
  
  private startPolling() {
    // Poll for task changes every second
    this.pollingInterval = setInterval(async () => {
      try {
        const tasks = await this.getRecentTaskChanges();
        
        for (const task of tasks) {
          this.wsGateway.broadcastToProcess(
            task.processInstanceId,
            'task:updated',
            this.transformTask(task)
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);
  }
  
  // Create task event in Camunda
  async emitTaskEvent(processInstanceId: string, event: string, taskData: any) {
    // Use Camunda API to create a message event
    await this.camundaClient.post('/message', {
      messageName: 'taskEvent',
      processInstanceId,
      processVariables: {
        event: { value: event, type: 'String' },
        taskData: { value: JSON.stringify(taskData), type: 'Json' }
      }
    });
  }
}
```

### 3. Real-time Chat Integration

```typescript
// components/workstream-chat-interface-reactive.tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function ReactiveWorkstreamChat({ executionId, processInstanceId }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);
  
  useEffect(() => {
    // Connect with auth
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: {
        token: accessToken
      },
      transports: ['websocket']
    });
    
    // Join rooms
    newSocket.emit('join-execution', executionId);
    newSocket.emit('join-process', processInstanceId);
    
    // Listen for real-time updates
    newSocket.on('message:new', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('task:created', (task) => {
      // Show task creation notification
      addWorkflowMessage({
        type: 'task-created',
        task,
        message: `New task: ${task.taskName}`
      });
    });
    
    newSocket.on('task:assigned', (task) => {
      // Update UI to show assignment
      addWorkflowMessage({
        type: 'task-assigned',
        task,
        message: `Task assigned to ${task.assignee}`
      });
    });
    
    newSocket.on('task:completed', (task) => {
      // Show completion
      addWorkflowMessage({
        type: 'task-completed',
        task,
        message: `Task completed: ${task.taskName}`
      });
    });
    
    newSocket.on('payment:status', (payment) => {
      // Update payment UI
      updatePaymentStatus(payment);
    });
    
    newSocket.on('agent:thinking', (data) => {
      // Show AI thinking indicator
      setAgentStatus(data);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [executionId, processInstanceId]);
  
  // Send message with WebSocket
  const sendMessage = (content: string) => {
    if (socket) {
      socket.emit('message:send', {
        executionId,
        content,
        timestamp: new Date()
      });
    }
  };
  
  return (
    // UI components with real-time updates
  );
}
```

### 4. Camunda Custom History Event Handler

```java
// CamundaWebSocketPlugin.java
public class CamundaWebSocketPlugin extends AbstractProcessEnginePlugin {
  
  @Override
  public void postInit(ProcessEngineConfigurationImpl config) {
    config.setCustomPostBPMNParseListeners(
      Arrays.asList(new WebSocketTaskListener())
    );
    
    // Add custom history event handler
    config.setHistoryEventHandler(new CompositeHistoryEventHandler(
      config.getHistoryEventHandler(),
      new WebSocketHistoryEventHandler()
    ));
  }
  
  public class WebSocketHistoryEventHandler implements HistoryEventHandler {
    @Override
    public void handleEvent(HistoryEvent event) {
      if (event instanceof HistoricTaskInstanceEventEntity) {
        // Send to WebSocket bridge via HTTP
        sendToWebSocketBridge(event);
      }
    }
  }
}
```

### 5. Scalable Architecture

```yaml
# docker-compose.yml for production
version: '3.8'
services:
  nginx:
    image: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    
  websocket-1:
    build: ./websocket-server
    environment:
      - REDIS_URL=redis://redis:6379
      - INSTANCE_ID=ws-1
    
  websocket-2:
    build: ./websocket-server
    environment:
      - REDIS_URL=redis://redis:6379
      - INSTANCE_ID=ws-2
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

## Benefits of This Approach

1. **True Real-time Updates**: All users see changes instantly
2. **Scalability**: Redis adapter allows horizontal scaling
3. **Reliability**: Fallback to polling if WebSocket fails
4. **Performance**: Minimal latency for user actions
5. **Flexibility**: Can handle any event type

## Event Types to Support

### Camunda Events
- task:created
- task:assigned
- task:completed
- task:updated
- process:started
- process:completed
- process:error

### NetBuild Events
- message:new
- message:edited
- agent:thinking
- agent:completed
- payment:initiated
- payment:confirmed
- form:submitted
- approval:requested
- approval:completed

### Cortex Events
- microservice:generating
- microservice:deployed
- optimization:suggested
- pattern:learned

## Client-Side State Management

```typescript
// contexts/websocket-context.tsx
export const WebSocketProvider: React.FC = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Optimistic updates with rollback
  const sendWithOptimisticUpdate = (event: string, data: any, optimisticUpdate: () => void) => {
    // Apply optimistic update
    optimisticUpdate();
    
    // Send via WebSocket
    socket?.emit(event, data, (ack: any) => {
      if (!ack.success) {
        // Rollback on failure
        rollbackOptimisticUpdate();
      }
    });
  };
  
  return (
    <WebSocketContext.Provider value={{ socket, connectionStatus, sendWithOptimisticUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

## Conclusion

Yes, we can absolutely achieve a reactive app with Camunda! The key is building a proper event bridge layer that:

1. Captures Camunda events through history handlers or polling
2. Broadcasts them via WebSocket to connected clients
3. Handles bi-directional communication for immediate updates
4. Scales horizontally with Redis pub/sub

This architecture provides the best of both worlds:
- Camunda's robust workflow engine
- Real-time, reactive user experience
- Scalability for thousands of concurrent users