# Camunda Tasklist Source Reference

This folder contains reference files from the official Camunda 7 Community Edition Tasklist UI.

## Source
- Repository: https://github.com/camunda/camunda-bpm-platform
- Path: /webapps/frontend/ui/tasklist/
- Version: 7.20.0 (Community Edition)

## Architecture
The original Camunda Tasklist is built with AngularJS and includes:
- Task listing and filtering
- Task assignment and completion
- Embedded form support
- Process variable management
- Plugin system

## Migration Strategy
Since NetBuild uses React/Next.js and the original uses AngularJS, we're creating React components that provide equivalent functionality using the Camunda REST API.

## Key Files Downloaded
- `camunda-tasklist-ui.js` - Main module definition showing dependencies and structure

## API Endpoints Used
The tasklist interacts with Camunda through these REST endpoints:
- GET /task - List tasks
- POST /task/{id}/claim - Claim a task
- POST /task/{id}/unclaim - Unclaim a task  
- POST /task/{id}/complete - Complete a task
- GET /task/{id}/form - Get task form
- GET /task/{id}/variables - Get task variables