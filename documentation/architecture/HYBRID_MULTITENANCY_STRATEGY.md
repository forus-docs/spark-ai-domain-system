# Hybrid Multi-Tenancy Strategy for NetBuild on Camunda 7

## Executive Summary

Yes, it is **practical and cost-effective** to implement a hybrid multi-tenancy approach in Camunda 7 where:
- **Small/Medium domains** share a single engine with tenant identifiers (logical isolation)
- **Large enterprise domains** get dedicated schema isolation when justified
- **Dynamic provisioning** allows upgrading domains as they grow

This approach optimizes costs for SMMEs while providing scalability for growth.

## Proposed Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NetBuild UI Layer                       │
├─────────────────────────────────────────────────────────────┤
│                   Tenant Router Service                      │
│            (Routes requests to appropriate engine)           │
├────────────────────────┬────────────────────────────────────┤
│   Shared Engine        │      Isolated Engines              │
│  (Small Domains)       │    (Enterprise Domains)            │
├────────────────────────┼────────────────────────────────────┤
│  PostgreSQL DB         │    PostgreSQL DB                   │
│  ┌─────────────────┐   │    ┌─────────────┐ ┌──────────┐  │
│  │ Shared Schema   │   │    │ Schema_Ent1 │ │Schema_Ent2│  │
│  │ - Domain A      │   │    │ - Full      │ │ - Full   │  │
│  │ - Domain B      │   │    │   Isolation │ │ Isolation│  │
│  │ - Domain C      │   │    └─────────────┘ └──────────┘  │
│  │ (tenantId)      │   │                                    │
│  └─────────────────┘   │                                    │
└────────────────────────┴────────────────────────────────────┘
```

## Implementation Strategy

### 1. Shared Engine Pool (Default for SMMEs)
```java
// Shared engine configuration
@Bean
public ProcessEngine sharedProcessEngine() {
    return ProcessEngineConfiguration
        .createStandaloneProcessEngineConfiguration()
        .setJdbcUrl("jdbc:postgresql://localhost/camunda_shared")
        .setDatabaseTablePrefix("SHARED_")
        .setTenantCheckEnabled(true) // Enable tenant isolation
        .buildProcessEngine();
}
```

**Cost Benefits:**
- Single database instance
- Shared connection pool
- Minimal memory footprint
- Lower hosting costs

### 2. Schema-Isolated Engines (Premium Tier)
```java
// Isolated engine for large enterprise
@Bean
@Qualifier("enterprise1")
public ProcessEngine enterpriseEngine() {
    return ProcessEngineConfiguration
        .createStandaloneProcessEngineConfiguration()
        .setJdbcUrl("jdbc:postgresql://localhost/camunda_enterprise1")
        .setDatabaseSchema("enterprise1")
        .setDatabaseTablePrefix("ENT1_")
        .buildProcessEngine();
}
```

**When to Isolate:**
- > 1000 active process instances/day
- Regulatory compliance requirements
- Custom SLAs
- High-value customers

### 3. Dynamic Tenant Router
```typescript
class TenantRouter {
    private sharedEngine: ProcessEngine;
    private isolatedEngines: Map<string, ProcessEngine>;
    
    async routeRequest(domainId: string, request: any) {
        const domain = await this.getDomainConfig(domainId);
        
        if (domain.isolationLevel === 'SHARED') {
            // Use shared engine with tenantId
            return this.sharedEngine.execute(request, { 
                tenantId: domainId 
            });
        } else {
            // Route to dedicated engine
            const engine = this.isolatedEngines.get(domainId);
            return engine.execute(request);
        }
    }
    
    async upgradeDomain(domainId: string) {
        // Migrate from shared to isolated
        const processes = await this.exportProcesses(domainId);
        const newEngine = await this.provisionIsolatedEngine(domainId);
        await this.importProcesses(newEngine, processes);
        await this.updateDomainConfig(domainId, 'ISOLATED');
    }
}
```

## Cost Analysis for SMMEs

### Shared Engine Costs (10-100 domains)
```
Infrastructure:
- 1x PostgreSQL instance (2 vCPU, 4GB RAM): $50/month
- 1x Application server (4 vCPU, 8GB RAM): $80/month
- Total: ~$130/month ($1.30-$13 per domain)

Resources per domain:
- ~10MB database storage
- Shared memory pool
- No additional infrastructure
```

### Isolated Engine Costs (Enterprise)
```
Per isolated domain:
- Dedicated schema: +5GB storage
- Additional memory: +500MB
- CPU overhead: +0.5 vCPU
- Estimated: +$50-100/month per isolated domain
```

## Migration Triggers

### Automatic Monitoring
```typescript
interface DomainMetrics {
    processInstancesPerDay: number;
    activeUsers: number;
    dataVolume: number;
    responseTime: number;
}

class IsolationAdvisor {
    shouldIsolate(metrics: DomainMetrics): boolean {
        return (
            metrics.processInstancesPerDay > 1000 ||
            metrics.activeUsers > 500 ||
            metrics.dataVolume > 5_000_000_000 || // 5GB
            metrics.responseTime > 2000 // 2s
        );
    }
}
```

## Practical Implementation Tips

### 1. Start All Domains as Shared
- Lower barrier to entry
- Minimal setup cost
- Prove value before scaling

### 2. Transparent Upgrade Path
```typescript
// Domain configuration
interface DomainConfig {
    id: string;
    name: string;
    isolationLevel: 'SHARED' | 'ISOLATED';
    tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    limits: {
        processInstances: number;
        users: number;
        storage: number;
    };
}
```

### 3. Performance Optimization for Shared Engine
```java
// Optimize shared engine for multi-tenancy
configuration
    .setJobExecutorActivate(true)
    .setJobExecutorMaxJobsPerAcquisition(10)
    .setJobExecutorWaitTimeInMillis(5000)
    .setJobExecutorMaxWait(60000)
    .setUseSharedSqlSessionFactory(true) // CRITICAL: Share 30MB+ memory
    .setDatabaseConnectionPool("hikari")
    .setJdbcMaxActiveConnections(20);
```

## Benefits for SMMEs

### 1. Cost-Effective Scaling
- Start at $1-2/month per domain
- Scale up only when needed
- No upfront infrastructure costs

### 2. Enterprise Features for All
- Every SMME gets workflow automation
- Same features as large enterprises
- Pay for isolation, not functionality

### 3. Growth-Friendly
- Seamless upgrade path
- No migration disruption
- Predictable cost scaling

## Implementation Roadmap

### Phase 1: Shared Engine (Week 1-2)
- Set up shared Camunda engine
- Implement tenant-based isolation
- Create domain provisioning API

### Phase 2: Monitoring (Week 3)
- Add metrics collection
- Build isolation advisor
- Create upgrade workflows

### Phase 3: Isolated Engines (Week 4)
- Implement dynamic engine provisioning
- Build migration tools
- Test upgrade scenarios

### Phase 4: Router Service (Week 5)
- Create intelligent routing layer
- Implement failover handling
- Add performance optimization

## Conclusion

The hybrid approach is **highly practical** and **cost-effective** for SMMEs:

✅ **Low entry cost**: ~$1.30/month per small domain
✅ **Scalable**: Upgrade to isolation when needed
✅ **Flexible**: Mix of shared and isolated domains
✅ **Enterprise-ready**: Full features for all tiers
✅ **SMME-friendly**: Pay for resources, not features

This architecture allows NetBuild to serve thousands of small domains on a single shared engine while providing enterprise-grade isolation for larger customers who need it.