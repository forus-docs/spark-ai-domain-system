# Database Strategy for NetBuild with Camunda Integration

## The MongoDB Challenge

**Can Camunda use MongoDB?**
**Answer: NO** - Camunda 7 requires a relational database with JDBC support. MongoDB is not supported.

## Recommended Database Architecture

Given NetBuild's existing MongoDB investment and Camunda's requirements, we recommend a **hybrid database strategy**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     NetBuild Application                         │
├─────────────────────────────────────────────────────────────────┤
│                      Data Access Layer                           │
├─────────────────┬─────────────────────┬─────────────────────────┤
│     MongoDB     │    PostgreSQL       │     Redis              │
│   (NetBuild)    │    (Camunda)        │   (Cache/Pub-Sub)     │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ • Users         │ • Process Instances │ • Session Cache        │
│ • Domains       │ • Task States       │ • WebSocket Pub/Sub   │
│ • Messages      │ • Process Variables │ • Rate Limiting       │
│ • Task Snapshots│ • History Events    │ • Queue Management    │
│ • Payments      │ • Timer Jobs        │                       │
│ • AI Context    │ • Deployments       │                       │
└─────────────────┴─────────────────────┴─────────────────────────┘
```

## Database Selection

### 1. **PostgreSQL for Camunda** (Recommended)
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: camunda
      POSTGRES_USER: camunda
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

**Why PostgreSQL?**
- Officially supported (versions 14-17)
- Excellent performance and reliability
- Strong community and tooling
- Works with Amazon Aurora for scaling
- JSON/JSONB support for flexible data

### 2. **MongoDB for NetBuild Data** (Existing)
Keep MongoDB for:
- User profiles and authentication
- Domain configurations
- Chat messages and AI context
- Task snapshots (immutable copies)
- Payment records
- FAISS vector embeddings metadata

### 3. **Redis for Real-time Features** (New)
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
```

Use Redis for:
- WebSocket pub/sub (Socket.IO adapter)
- Session management
- Rate limiting
- Temporary queue for events
- Cache for frequently accessed data

## Data Synchronization Strategy

### 1. **Event-Driven Sync**
```typescript
// services/data-sync/sync-service.ts
export class DataSyncService {
  async onProcessStarted(processInstance: CamundaProcessInstance) {
    // Store reference in MongoDB
    await WorkflowExecution.create({
      processInstanceId: processInstance.id,
      executionId: processInstance.businessKey,
      domainId: processInstance.tenantId,
      variables: processInstance.variables,
      status: 'active',
      startedAt: new Date()
    });
    
    // Publish to Redis for real-time updates
    await redisClient.publish('process:started', JSON.stringify({
      processInstanceId: processInstance.id,
      domainId: processInstance.tenantId
    }));
  }
  
  async onTaskCreated(task: CamundaTask) {
    // Update MongoDB execution
    await TaskExecution.findOneAndUpdate(
      { processInstanceId: task.processInstanceId },
      { 
        $set: { 
          currentTaskId: task.id,
          currentTaskName: task.name,
          status: 'in_progress'
        }
      }
    );
  }
}
```

### 2. **Unified Query Interface**
```typescript
// services/unified-query.service.ts
export class UnifiedQueryService {
  async getExecutionDetails(executionId: string) {
    // Get NetBuild data from MongoDB
    const execution = await TaskExecution.findOne({ executionId });
    
    // Get Camunda process data
    const processInstance = await camundaApi.get(
      `/process-instance/${execution.processInstanceId}`
    );
    
    // Get active tasks from Camunda
    const tasks = await camundaApi.get(
      `/task?processInstanceId=${execution.processInstanceId}`
    );
    
    // Combine and return
    return {
      ...execution.toObject(),
      processState: processInstance.data,
      activeTasks: tasks.data
    };
  }
}
```

## Migration Considerations

### Phase 1: Add PostgreSQL
1. Deploy PostgreSQL alongside MongoDB
2. Configure Camunda to use PostgreSQL
3. Keep all NetBuild data in MongoDB

### Phase 2: Add Redis
1. Deploy Redis for caching and pub/sub
2. Implement Socket.IO with Redis adapter
3. Cache frequently accessed data

### Phase 3: Optimize Queries
1. Create materialized views in PostgreSQL
2. Add MongoDB aggregation pipelines
3. Implement Redis caching strategies

## Performance Optimization

### 1. **Connection Pooling**
```typescript
// PostgreSQL connection pool
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: 'camunda',
  user: 'camunda',
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB connection options
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
});
```

### 2. **Query Optimization**
- Create indexes on frequently queried fields
- Use PostgreSQL materialized views for reports
- Leverage MongoDB aggregation pipelines
- Cache results in Redis

### 3. **Data Partitioning**
- Partition Camunda history by date
- Archive completed processes
- Use MongoDB time-series collections for metrics

## Backup and Recovery

### Coordinated Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out=/backup/mongo-$(date +%Y%m%d)

# Backup PostgreSQL
pg_dump -h localhost -U camunda -d camunda > /backup/postgres-$(date +%Y%m%d).sql

# Backup Redis (if persistence enabled)
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Upload to S3 or similar
aws s3 sync /backup s3://netbuild-backups/$(date +%Y%m%d)/
```

## Cost Considerations

### Estimated Monthly Costs (AWS)
- **MongoDB Atlas**: M10 cluster ~$60/month
- **PostgreSQL RDS**: db.t3.medium ~$70/month  
- **ElastiCache Redis**: cache.t3.micro ~$20/month
- **Total**: ~$150/month for development/staging

### Production Scaling
- MongoDB Atlas: M30+ for production
- PostgreSQL: Multi-AZ RDS deployment
- Redis: Cluster mode for high availability

## Conclusion

While we cannot use MongoDB for Camunda, a hybrid approach gives us:
1. **Best of both worlds**: Document store for flexibility, relational for workflows
2. **Scalability**: Each database optimized for its use case
3. **Maintainability**: Clear separation of concerns
4. **Performance**: Caching and optimized queries
5. **Future-proof**: Easy to scale each component independently

This architecture supports NetBuild's growth while maintaining the benefits of both MongoDB's flexibility and Camunda's robust workflow engine.