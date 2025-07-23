# MongoDB Migration Scripts

This directory contains scripts to migrate mock data from TypeScript files to MongoDB collections for the Spark AI Domain System.

## Overview

The migration package moves data from:
- `app/lib/mock-data.ts` → MongoDB `domains` collection
- `app/lib/sprint2-mock-data/process-mock-data.ts` → MongoDB `processes` collection

## Prerequisites

1. **MongoDB must be running** on port 27017:
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod | grep -v grep
   
   # Start MongoDB if not running
   /Users/jacquesvandenberg/eos-forus/mongodb-macos-aarch64-8.0.11/bin/mongod \
     --dbpath ~/data/db \
     --port 27017 \
     --bind_ip 127.0.0.1 &
   ```

2. **Environment variables** must be configured in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/spark-ai
   ```

## Migration Scripts

### 1. Domain Migration (`migrate-domains.ts`)
Migrates all domain data including:
- Domain metadata (name, tagline, description, etc.)
- Roles and pricing information
- Navigation items specific to each domain
- Member counts and regional information

### 2. Process Migration (`migrate-processes.ts`)
Migrates all process templates including:
- Process execution models (form, sop, knowledge, bpmn, training)
- AI agent configurations
- Domain associations
- Maturity stages (manual, assisted, supervised, automated, ai_promoted)
- Process-specific details (forms, SOPs, training modules, etc.)

### 3. Master Migration (`migrate-all.ts`)
Runs all migrations in the correct order:
1. Domains (must exist before processes can reference them)
2. Processes (requires domain ObjectIds)

## Usage

### Run All Migrations
```bash
npm run migrate:all
```

### Run Individual Migrations
```bash
# Migrate only domains
npm run migrate:domains

# Migrate only processes (requires domains to exist)
npm run migrate:processes
```

### Seed Posts (separate from migration)
```bash
npm run seed:posts
```

## Data Summary

### Domains (4 total)
- **Maven Hub**: Global Investment Network
- **Wealth on Wheels**: Digital Transport Revolution
- **Bemnet**: Financial Inclusion on Blockchain
- **PACCI**: Pan African Chamber of Commerce

### Processes (10 total)
By execution model:
- **Form (2)**: Investor Profile Creation, Savings Goal Planning
- **SOP (2)**: Project Registration Process, Daily Vehicle Inspection
- **Knowledge (3)**: Investment Analysis, Credit Score Calculation, Market Intelligence
- **BPMN (2)**: Daily Fleet Route Planning, Trade Finance Application
- **Training (1)**: Driver Safety Training

### AI Agent Status
- **8 processes** have AI agents attached
- **1 process** achieved AI promotion (Daily Fleet Route Planning)
- AI agents are in various stages: manual, assisted, supervised

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
lsof -i :27017

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Migration Errors
1. **"Domain not found"**: Run domain migration first
2. **"Validation error"**: Check model schemas match mock data structure
3. **"Duplicate key"**: Scripts clear collections first, but check for unique indexes

### Verification
Use MongoDB Compass to verify data:
```bash
# Install MongoDB Compass
brew install --cask mongodb-compass

# Connect to database
# Connection string: mongodb://localhost:27017/spark-ai
```

## Development Notes

### Adding New Mock Data
1. Update the appropriate mock data file
2. Update the corresponding migration script
3. Test the migration in isolation
4. Update the master migration script if needed

### Model Changes
If you modify MongoDB models:
1. Update the migration scripts to match new schema
2. Consider data transformation if needed
3. Test thoroughly before running in production

## Related Files
- Models: `app/models/`
- Mock data: `app/lib/mock-data.ts`, `app/lib/sprint2-mock-data/`
- Database config: `app/lib/database.ts`