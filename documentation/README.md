# NetBuild Documentation

Welcome to the comprehensive documentation for NetBuild - a multi-domain business process platform that combines identity verification, process automation, and smart contract payments.

## 🎯 Vision & Strategy

### Core Reports
- [Identity-Verified Process Economy](./reports/IDENTITY_VERIFIED_PROCESS_ECONOMY.md) - How NetBuild creates trusted business processes for Africa and emerging markets
- [Investability Through Process Excellence](./reports/INVESTABILITY_THROUGH_PROCESS_EXCELLENCE.md) - Bridging Global North capital with Global South opportunities

### Technology Foundation
- [Technology Stack Rationale](./architecture/TECHNOLOGY_STACK_RATIONALE.md) - Why we build on proven technologies
- [NetBuild Roadmap](./NETBUILD_ROADMAP.md) - Product development timeline and milestones

## Documentation Structure

### 📐 `/architecture`
System design, architecture decisions, and technical structure documentation.
- `TECHNOLOGY_STACK_RATIONALE.md` - Why we chose each technology component
- `CODEBASE_INDEX.md` - Comprehensive codebase reference
- `PROJECT_STRUCTURE_ANALYSIS.md` - Complete system architecture analysis
- `NETBUILD_CAMUNDA_STACK.md` - Integrated BPM architecture
- `DATABASE_STRATEGY.md` - MongoDB schema and scaling approach
- `HYBRID_MULTITENANCY_STRATEGY.md` - Domain isolation architecture
- `KEYCLOAK_INTEGRATION_GUIDE.md` - OAuth2/SSO implementation guide
- `CAMUNDA_INTEGRATION_PLAN.md` - BPM engine integration roadmap
- `WEBSOCKET_INTEGRATION_PLAN.md` - Real-time communication architecture
- `NAVIGATION_AND_ROUTING.md` - Routing patterns and navigation architecture
- `USER_FLOW_DIAGRAM.md` - User journey and flow diagrams
- `SOP_STRUCTURE_DOCUMENTATION.md` - Standard Operating Procedure system architecture
- `SIMPLIFIED_ARCHITECTURE_MIGRATION.md` - Architecture migration guide
- `NETBUILD_CORTEX_INTEGRATION.md` - AI agent integration architecture
- `MCP_CAMUNDA_INTEGRATION.md` - MCP server integration guide
- `CAMUNDA_TASKLIST_INTEGRATION.md` - Tasklist UI integration

### 📋 `/planning`
Sprint plans, implementation strategies, and feature planning documents.
- `SPRINT_PLANNING.md` - Overall project sprint planning and roadmap
- `CAMUNDA_TASKLIST_FULL_IMPLEMENTATION_PLAN.md` - Complete Camunda Tasklist implementation (10-week plan)
- `CHATSCOPE_IMPLEMENTATION_PLAN.md` - Chat UI enhancement plan
- `CHATSCOPE_SPRINT_PLAN.md` - Sprint planning for chat features
- `STEP_TRACKING_DESIGN.md` - Design for step-level status tracking feature
- `TASKS_PAGE_IMPLEMENTATION_PLAN.md` - Task management implementation (ARCHIVED - see Camunda plan)

### 📊 `/reports`
Analysis reports, audits, and technical assessments.
- `IDENTITY_VERIFIED_PROCESS_ECONOMY.md` - Vision report on digital ID and process economy for Africa
- `INVESTABILITY_THROUGH_PROCESS_EXCELLENCE.md` - How BPM creates investable businesses
- `TECHNICAL_DEBT_REGISTER.md` - Technical debt tracking and remediation
- `TASK_SCHEMA_AUDIT.md` - Database schema audit report
- `CONTACT_ACCESS_LIBRARIES_REPORT.md` - Research report on contact access solutions
- `LINK_PREVIEW_FIXES.md` - Bug fix report for link preview implementation
- `DOMAIN_NAVIGATION_REFACTORING_REPORT.md` - Navigation improvement analysis

### 📚 `/guides`
How-to guides, patterns, and development guidelines.
- `KEYCLOAK_SETUP.md` - Keycloak identity provider setup guide
- `KEYCLOAK_CAMUNDA_SETUP.md` - Step-by-step guide for Keycloak-Camunda integration
- `KEYCLOAK_CAMUNDA_SSO_SETUP.md` - Complete SSO integration setup guide
- `DATABASE_INDEXES.md` - Database index naming conventions and patterns
- `MONGODB_ADMIN_GUIDE.md` - MongoDB administration and Compass usage guide
- `MONGODB_MCP_USAGE.md` - MongoDB MCP server configuration and usage
- `QMS_API_DOCUMENTATION.md` - Quality Management System compliant API documentation
- `LINK_PREVIEW_IMPLEMENTATION.md` - Implementation guide for link previews in chat
- `LIBRECHAT_ARTIFACT_PATTERN.md` - LibreChat integration patterns

### 🗄️ `/archive`
Completed or superseded documentation preserved for historical reference.
- `NETBUILD_RENAMING_REPORT.md` - Completed project rename from Spark AI to NetBuild
- `DOMAIN_NAVIGATION_REFACTORING_REPORT.md` - Completed navigation refactoring
- See archive README for full list

### 🔧 `/external-references`
External documentation and analysis
- `forus-cortex-agent-analysis.md` - AI agent capabilities analysis

### 📦 `/camunda-tasklist-source`
Reference implementation files
- Camunda Tasklist UI source code for reference

### 💡 `/technical-debt`
Technical debt and future vision documents
- `admin-portal-vision.md` - Future admin portal design

## 🚀 Quick Start Guides

### For Developers
1. Start with [Technology Stack Rationale](./architecture/TECHNOLOGY_STACK_RATIONALE.md)
2. Review [Project Structure Analysis](./architecture/PROJECT_STRUCTURE_ANALYSIS.md)
3. Check [Codebase Index](./architecture/CODEBASE_INDEX.md)
4. Follow [Sprint Planning](./planning/SPRINT_PLANNING.md)

### For Business Stakeholders
1. Read [Identity-Verified Process Economy](./reports/IDENTITY_VERIFIED_PROCESS_ECONOMY.md)
2. Understand [Investability Through Process Excellence](./reports/INVESTABILITY_THROUGH_PROCESS_EXCELLENCE.md)
3. Review [NetBuild Roadmap](./NETBUILD_ROADMAP.md)

### For DevOps
1. Setup [Keycloak](./guides/KEYCLOAK_SETUP.md) and [Camunda SSO](./guides/KEYCLOAK_CAMUNDA_SSO_SETUP.md)
2. Configure [MongoDB](./guides/MONGODB_ADMIN_GUIDE.md) with proper [indexes](./guides/DATABASE_INDEXES.md)
3. Review [Database Strategy](./architecture/DATABASE_STRATEGY.md)

### For Architects
1. Study [NetBuild + Camunda Stack](./architecture/NETBUILD_CAMUNDA_STACK.md)
2. Understand [Hybrid Multi-tenancy](./architecture/HYBRID_MULTITENANCY_STRATEGY.md)
3. Review [Integration Plans](./architecture/CAMUNDA_INTEGRATION_PLAN.md)

## Documentation Standards

1. **File Naming**: Use UPPERCASE with underscores for multi-word files (e.g., `USER_FLOW_DIAGRAM.md`)
2. **Categorization**: Place documents in the most appropriate subdirectory
3. **Cross-References**: Use relative paths when linking between documents
4. **Updates**: Keep documentation current with code changes
5. **No Root Docs**: Never place documentation files in the project root (except README.md and CLAUDE.md)

## Key Resources

- **Architecture Overview**: [PROJECT_STRUCTURE_ANALYSIS.md](./architecture/PROJECT_STRUCTURE_ANALYSIS.md)
- **Technical Debt**: [TECHNICAL_DEBT_REGISTER.md](./reports/TECHNICAL_DEBT_REGISTER.md)
- **User Flows**: [USER_FLOW_DIAGRAM.md](./architecture/USER_FLOW_DIAGRAM.md)
- **Current Sprint**: [SPRINT_PLANNING.md](./planning/SPRINT_PLANNING.md)

## Project Guidelines

For project-specific guidelines and coding standards:
- [Project CLAUDE.md](../CLAUDE.md) - NetBuild-specific guidelines
- [Digital CLAUDE.md](../../CLAUDE.md) - Digital workspace guidelines
- [EOS CLAUDE.md](../../../CLAUDE.md) - Forus ecosystem guidelines