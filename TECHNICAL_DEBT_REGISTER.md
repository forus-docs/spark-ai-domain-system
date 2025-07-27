# Technical Debt Register - Spark AI Domain System

Last Updated: January 2025

## Overview
This register tracks technical debt in the Spark AI Domain System based on actual code analysis.

## Current State Assessment

### What's Working Well ✅
1. **QMS-Compliant Architecture** - Immutable snapshot data flow fully implemented
2. **Database Naming Complete** - Collections already renamed (masterTasks, domainTasks, userTasks, taskExecutions)
3. **JWT Authentication** - Secure token-based auth with refresh tokens
4. **SSE Streaming** - Real-time chat with Server-Sent Events
5. **React Context Architecture** - Clean separation of concerns (Auth, Domain, Chat, File)
6. **Service Layer Refactoring** - Task Journey Service split into 4 focused services with facade pattern
7. **MongoDB Integration** - MCP tools configured and working

### Completed ✅
1. **Database Collections** - Renamed to masterTasks, domainTasks, userTasks, taskExecutions
2. **Model Files** - Renamed to match collections
3. **Import Aliases** - All imports now use correct names (DomainTask, UserTask, etc.)
4. **Service Layer** - Task Journey Service refactored into 4 focused services
5. **Schema Complexity** - Unified MasterTask/DomainTask/UserTask into single schema with optional fields
   - Removed complex snapshot validation logic
   - Simplified services to use simple object copying
   - Updated API routes to use unified MasterTask model

## Priority 0: Critical Issues 🔴

### 1. Excessive Debug Logging
**Impact**: MEDIUM - Security risk in production
**Examples**:
- User IDs logged in task-display.service.ts
- Full query objects logged
- Database connection details exposed

**Fix**: Implement proper logging levels, remove sensitive data

### 2. Hardcoded Mock Data in Critical Routes
**Impact**: HIGH - Production readiness blocker
**Location**: `/app/domains/[domainId]/processes/[masterTaskId]/page.tsx`
**Issue**: Uses hardcoded mock data instead of fetching from database
**Fix**: Use the existing `/api/master-tasks/[masterTaskId]` endpoint

## Priority 1: High Impact 🟡

### 3. Zero Test Coverage
**Impact**: HIGH - No automated testing
**Current State**: 
- No test files in project (only in node_modules)
- No jest/vitest configuration
- No CI/CD test pipeline

**Needed**:
- Unit tests for services
- Integration tests for APIs
- E2E tests for critical flows

### 4. Type Safety Gaps
**Examples**:
```typescript
let domainTask: any;  // task-assignment.service.ts
const query: any = { userId };  // task-display.service.ts
```
**Fix**: Create proper TypeScript interfaces

### 5. Missing API Input Validation
**Risk**: Security vulnerability
**Current State**: Minimal validation on request bodies
**Fix**: Add Zod or similar validation middleware

### 6. Missing Domain Access Guards
**Risk**: Security vulnerability - unauthorized access
**Locations**: 
- `/app/domains/[domainId]/processes/[masterTaskId]/page.tsx` - No check if user is domain member
- Task execution creation doesn't verify domain membership
**Fix**: Add domain membership verification before allowing access

## Priority 2: Medium Impact 🟢

### 7. Component Size
**Large Files**:
- `chat-interface-v2.tsx`: 1000+ lines
- `home page.tsx`: 475 lines
**Fix**: Break into smaller components

### 8. No Error Boundaries
**Impact**: Single error crashes UI
**Fix**: Add React error boundaries around major components

### 9. ~~Import Alias Inconsistency~~ ✅ FIXED
**Status**: RESOLVED - All imports now use correct names matching the model files.

### 10. Missing Environment Config
**Hardcoded Values**:
- Port 3001 in multiple places
- Token expiry times scattered
- "24 hours" for new task determination

### 11. No Caching Layer
**Impact**: Every request hits MongoDB
**Opportunity**: Cache domain/master task data

## Priority 3: Nice to Have 🔵

### 12. API Response Inconsistency
**Issue**: Different error formats
- Some: `{ error: string }`
- Others: `{ message: string }`

### 13. Missing API Documentation
**Current**: No OpenAPI/Swagger docs
**Need**: Automated API documentation

### 14. No Database Migrations
**Risk**: Manual schema changes via scripts
**Need**: Proper migration framework

### 15. Bundle Size Optimization
**Opportunity**: Lazy load heavy components

## Quick Wins (Can Do Today) ⚡

1. **Remove Debug Logs** (2 hours)
   - Remove console.logs with sensitive data
   - Add proper logging library

2. **Fix Model Imports** (4 hours)
   - Rename model files to match collections
   - Update all imports

3. **Add Basic Validation** (4 hours)
   - Add Zod to critical endpoints
   - Validate user input

4. **Environment Config** (2 hours)
   - Create config/constants.ts
   - Move hardcoded values

## Recommended Action Plan

### Week 1: Critical Fixes
1. Complete naming refactor (align code with database)
2. Remove sensitive logging
3. Fix model imports

### Month 1: Foundation
1. Add test framework and initial tests
2. Add input validation
3. Fix TypeScript any types
4. Add error boundaries

### Month 2-3: Quality
1. Achieve 50% test coverage
2. Refactor large components
3. Add caching layer
4. Standardize API responses

### Quarter: Scale
1. Add monitoring/APM
2. Comprehensive documentation
3. Performance optimization
4. Security audit

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 0% | 70% |
| TypeScript Strict | ~60% | 95% |
| Component Size | 500+ lines | <200 lines |
| API Response Time | Unmeasured | <200ms p95 |
| Error Rate | Unknown | <0.1% |

## Notes

The project has a solid foundation with good architectural decisions (QMS compliance, snapshot architecture, proper auth). The main debt is around incomplete refactoring and missing quality infrastructure (tests, monitoring, documentation).