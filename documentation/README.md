# NetBuild Documentation

This directory contains all project documentation organized by category. All documentation MUST be placed in the appropriate subdirectory - no documentation files should be placed in the project root.

## Documentation Structure

### 📐 `/architecture`
System design, architecture decisions, and technical structure documentation.
- `CODEBASE_INDEX.md` - Comprehensive codebase reference
- `KEYCLOAK_INTEGRATION_GUIDE.md` - Keycloak OAuth2 integration with Camunda
- `NAVIGATION_AND_ROUTING.md` - Routing patterns and navigation architecture
- `PROJECT_STRUCTURE_ANALYSIS.md` - Complete system architecture analysis
- `SIMPLIFIED_ARCHITECTURE_MIGRATION.md` - Architecture migration guide
- `USER_FLOW_DIAGRAM.md` - User journey and flow diagrams

### 📋 `/planning`
Sprint plans, implementation strategies, and feature planning documents.
- `CAMUNDA_TASKLIST_FULL_IMPLEMENTATION_PLAN.md` - Complete Camunda Tasklist implementation (10-week plan)
- `CHATSCOPE_IMPLEMENTATION_PLAN.md` - Chat UI enhancement plan
- `CHATSCOPE_SPRINT_PLAN.md` - Sprint planning for chat features
- `TASKS_PAGE_IMPLEMENTATION_PLAN.md` - Task management implementation (ARCHIVED - see Camunda plan)

### 📊 `/reports`
Analysis reports, audits, and technical assessments.
- `TASK_SCHEMA_AUDIT.md` - Database schema audit report
- `TECHNICAL_DEBT_REGISTER.md` - Technical debt tracking

### 🗄️ `/archive`
Completed or superseded documentation preserved for historical reference.
- `DOMAIN_NAVIGATION_REFACTORING_REPORT.md` - Completed navigation refactoring (moved from reports)
- See archive README for full list

### 📚 `/guides`
How-to guides, patterns, and development guidelines.
- `KEYCLOAK_SETUP.md` - Keycloak identity provider setup guide
- `LIBRECHAT_ARTIFACT_PATTERN.md` - LibreChat integration patterns

### 🗄️ `/docs` (Legacy)
Legacy documentation folder - content being migrated to new structure.
- Various database and operational guides

## Documentation Standards

1. **File Naming**: Use UPPERCASE with underscores for multi-word files (e.g., `USER_FLOW_DIAGRAM.md`)
2. **Categorization**: Place documents in the most appropriate subdirectory
3. **Cross-References**: Use relative paths when linking between documents
4. **Updates**: Keep documentation current with code changes
5. **No Root Docs**: Never place documentation files in the project root (except README.md and CLAUDE.md)

## Quick Links

- [Architecture Overview](./architecture/PROJECT_STRUCTURE_ANALYSIS.md)
- [Codebase Index](./architecture/CODEBASE_INDEX.md)
- [Technical Debt](./reports/TECHNICAL_DEBT_REGISTER.md)
- [User Flows](./architecture/USER_FLOW_DIAGRAM.md)