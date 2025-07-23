# Spark AI Domain System

## Overview
The Spark AI Domain System is a multi-role, multi-domain enterprise platform that enables users to join industry-specific ecosystems (domains), select roles, and access domain-specific features with AI-assisted process execution.

## Current Status (January 2025)
- **Production-ready** authentication system with JWT tokens
- **MongoDB** database integration for all data storage
- **Real-time chat** with Server-Sent Events (SSE)
- **PostJourney system** for personalized user experiences
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
/Users/jacquesvandenberg/eos-forus/mongodb-macos-aarch64-8.0.11/bin/mongod \
  --dbpath ~/data/db \
  --port 27017 &

# Run development server (port 3001)
npm run dev

# Run database migrations
npm run migrate:all
npm run seed:posts
```

## Architecture

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

#### PostJourney System
Creates personalized user experiences through:
- **Master Posts**: Templates defining available activities
- **UserPosts**: User-specific assignments tracking progress
- **Process Integration**: Links to AI-assisted processes
- **Dynamic Context**: Full SOP context for compliance

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

### Data Flow
```
Posts → UserPosts → Processes → Conversations → Messages
         ↓              ↓
     Domain-specific   SOP Context
     Assignment        for AI
```

## Key Documentation

### Current Architecture
- `PROJECT_STRUCTURE_ANALYSIS.md` - Complete system architecture
- `USER_FLOW_DIAGRAM.md` - Visual flow diagrams
- `CLAUDE.md` - Development guidelines

### Implementation Guides
- `docs/sop-structure-documentation.md` - SOP structure reference
- `docs/mongodb-admin-guide.md` - Database operations
- `docs/mongodb-mcp-usage.md` - MCP tool usage
- `scripts/README.md` - Migration documentation

## Database Collections

### Core Collections
- **users** - User accounts and authentication
- **domains** - Domain configurations
- **processes** - Process templates with execution models
- **posts** - Master post templates
- **userposts** - User-specific post assignments
- **conversations** - Chat conversation metadata
- **messages** - Individual chat messages

## Development Tools

### MongoDB MCP Server
Direct database access through natural language:
- Configuration: `.mcp.json`
- Connection: `mongodb://localhost:27017/spark-ai`
- Tools prefix: `mcp__mongodb__`

### VS Code Debug
- Configuration: `.vscode/launch.json`
- Port: 3001
- Full-stack debugging with breakpoints

## Design Philosophy
Minimalist approach with:
- Clean, uncluttered interfaces
- Generous whitespace
- Subtle interactions
- Typography-first hierarchy
- Mobile-first responsive design

## Historical Reference
For Sprint documentation and historical specifications, see the `/archive/` directory.

---

For detailed information, refer to the documentation files listed above.