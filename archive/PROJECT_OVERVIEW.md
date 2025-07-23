# Spark AI Domain System - Project Overview

This document provides a high-level overview of the Spark AI Domain System for stakeholders, developers, and AI assistants.

**For Claude Code specific guidance, see:**
- `CLAUDE.md` - Project-specific development guidance
- `.vscode/CLAUDE.md` - Workspace-level guidelines

## Executive Summary
A multi-role, multi-domain platform that democratizes enterprise tools for SMMEs through AI assistance and embedded stablecoin payments. Users join industry-specific ecosystems, select roles, and access domain-specific features.

## Key Concepts

### Domains
Industry-specific ecosystems (e.g., Maven Hub for investments, Wealth on Wheels for transport) where users can join with specific roles and access tailored features.

### Roles
Each domain supports multiple roles with different benefits and pricing. Users select a role when joining a domain (e.g., Investor, Project Owner, Advisor in Maven Hub).

### Navigation
Domain-aware navigation that adapts based on the user's current domain context. Features are hidden/shown based on domain selection. "Organogram" appears in navigation above "Workstreams".

## Project Structure
```
forus-spark/
├── specs/                     # Core specifications
│   ├── domain/               # Domain system specs
│   │   ├── domain-schema.xml         # Data model (XML)
│   │   └── *.md                      # Other specs
│   ├── navigation/           # Navigation specs
│   └── schemas/              # XML schemas
│       └── spark-spec.xsd    # Schema definition
├── sprints/                  # Sprint-based development
│   └── sprint1/             # MVP implementation
│       ├── specs/           
│       │   └── sprint1-spec.xml      # Sprint spec (XML)
│       ├── components/      
│       └── mock-data/       
├── docs/                     # Documentation
│   ├── design/              # Design guides
│   └── developer/           # Developer docs
└── README.md
```

## Current Sprint (Sprint 1)
Building MVP with:
- Domain browsing and joining
- Role selection
- Domain context switching
- Stubbed content sections
- Mock data implementation

## Technical Stack
- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18+
- **Styling**: Tailwind CSS (minimalist design)
- **State**: Context API
- **Language**: TypeScript

## Design Philosophy
Minimalist, elegant design with:
- Clean interfaces
- Generous whitespace
- Subtle interactions
- Typography-first hierarchy
- Restrained color usage

## Key Files

### XML Specifications (AI-Readable)
- `sprints/sprint1/specs/sprint1-spec.xml` - Sprint 1 requirements with acceptance criteria
- `specs/domain/domain-schema.xml` - Complete data model with constraints
- `specs/schemas/spark-spec.xsd` - XML schema definition
- `sprints/sprint2/specs/ai-agent-schema.xml` - Comprehensive AI agent schema for Sprint 2

### Implementation Files
- `sprints/sprint1/components/unified-domain-ui.tsx` - Main UI implementation
- `sprints/sprint1/mock-data/mock-data.ts` - Mock data
- `docs/design/styling-guide.md` - Minimalist design system

### Original Specs (Markdown)
- `specs/domain/unified-schema-spec.md` - Core data model documentation
- `specs/domain/multi-domain-system-spec.md` - Multi-domain architecture
- `specs/navigation/navigation-system-doc.md` - Navigation documentation

## Development Guidelines
1. Follow minimalist design principles
2. Use TypeScript for all components
3. Implement domain-aware navigation
4. Session-based state persistence
5. Mobile-first responsive design

## Custom Instructions
- Navigation items are domain-specific (only show when domain selected)
- "Organogram" appears in navigation above "Workstreams"
- All content sections are stubbed in Sprint 1
- Mock data includes 4 domains: Maven, WoW, Bemnet, PACCI
- Users can join multiple domains with different roles
- AI Agents removed from Sprint 1 (comprehensive schema in Sprint 2)

## XML Specifications for AI Development
The project uses XML specifications to enable AI-assisted development:

### Sprint Specification (`sprint1-spec.xml`)
- 12 acceptance criteria with test cases
- Component definitions with props and behavior
- Implementation tracking with coverage percentages
- AI instructions for code generation

### Data Model (`domain-schema.xml`)
- Complete type definitions with validation constraints
- Field-level rules (min/max length, patterns, etc.)
- Foreign key relationships
- Phase 2 extensions clearly marked

### Benefits for AI Assistants
1. Generate TypeScript interfaces from XML data models
2. Create component stubs with correct props
3. Generate test cases from acceptance criteria
4. Track implementation progress automatically
5. Validate code against specifications

### Using XML Specs
When working with AI assistants:
- Reference XML files for accurate requirements
- Use acceptance criteria IDs (e.g., AC-001) to track progress
- Generate code from data model definitions
- Validate implementations against XML specifications