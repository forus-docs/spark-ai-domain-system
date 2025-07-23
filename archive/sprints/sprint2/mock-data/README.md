# Sprint 2 Mock Data - Process Execution System

## Overview
This directory contains mock data for **processes** with configurable execution models. AI agents are optional tools that can be attached to help learn and automate these processes.

## Key Concept
**Processes** are the core unit of work, not AI agents. An AI agent is just one possible tool that can be configured to help with a process.

## Process Maturity Stages

1. **Manual** - Human executes the process without AI help
2. **Assisted** - AI helps but human does the work
3. **Supervised** - AI does the work but human supervises
4. **Automated** - AI has generated code/workflows that run independently

## Process Distribution by Domain

### Maven Hub
- **Investor Profile Creation** (Form) - AI-assisted
- **Investment Opportunity Analysis** (Knowledge) - Manual with AI learning
- **Project Registration Process** (SOP) - AI-supervised

### Wealth on Wheels
- **Daily Fleet Route Planning** (BPMN) - Fully automated
- **Driver Safety Training** (Training) - AI-assisted
- **Vehicle Compliance Verification** (SOP) - Manual, no AI

### Bemnet
- **Credit Score Calculation** (Knowledge) - AI-supervised
- **Savings Goal Planning** (Form) - AI-assisted

### PACCI
- **Trade Finance Application** (BPMN) - AI-supervised
- **Market Intelligence Gathering** (Knowledge) - AI-assisted

## The 5 Execution Models

1. **Form** - Structured data collection
2. **SOP** - Standard Operating Procedures
3. **Knowledge** - Information retrieval and analysis
4. **BPMN** - Business Process workflows
5. **Training** - Educational processes

## Mock Data Structure

Each process includes:
- `id`: Unique identifier
- `name`: Display name
- `executionModel`: One of the 5 models
- `description`: What the process does
- `currentStage`: Maturity level (manual/assisted/supervised/automated)
- `aiAgentAttached`: Whether an AI agent is configured
- `aiAgentRole`: What the AI does (if attached)
- `allowedRoles`: Which domain roles can access it

## Important Insights

- AI agents are **optional** - see "Vehicle Compliance Verification" (no AI)
- **AI Promotion** - see "Daily Fleet Route Planning" where AI earned its promotion
- The same process container handles all maturity stages
- AI agents work toward promotion by generating executable artifacts
- Success is measured by how many AI agents achieve promotion

## The Goal: AI Promotion

The ultimate success for an AI agent is **AI Promotion** - when it has learned enough to generate code, workflows, or algorithms that can run independently. The AI agent is then promoted from that mundane task to take on more important, creative challenges.

**AI Promotion is not about eliminating AI - it's about advancing AI to higher-value work.**