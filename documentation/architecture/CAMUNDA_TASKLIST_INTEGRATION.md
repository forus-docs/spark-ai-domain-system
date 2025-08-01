# Camunda Tasklist Integration

## Overview

NetBuild now includes an integrated Camunda Tasklist in the left sidebar, providing direct access to workflow tasks without leaving the NetBuild interface.

## Architecture

### Frontend Components

Located in `/app/components/tasklist/`:
- **TaskList.tsx** - Main list component with task items
- **TaskFilters.tsx** - Filter controls (All/My Tasks/Unassigned, Process filter, Search)
- **TaskDetails.tsx** - Detailed task view with form fields and completion

### API Routes

Located in `/app/api/camunda/tasks/`:
- `GET /api/camunda/tasks` - Get process definitions for filters
- `POST /api/camunda/tasks` - List tasks with filters
- `GET /api/camunda/tasks/[taskId]` - Get task details
- `POST /api/camunda/tasks/[taskId]/claim` - Claim a task
- `DELETE /api/camunda/tasks/[taskId]/claim` - Unclaim a task
- `POST /api/camunda/tasks/[taskId]/complete` - Complete a task

### Integration Points

1. **Authentication**: Uses NetBuild's JWT tokens, maps to Camunda users
2. **Navigation**: Added to sidebar as "Tasklist" with ClipboardList icon
3. **Domain Scoping**: Respects current domain context
4. **User Mapping**: Uses email as Camunda user ID (e.g., demo@example.com → demo)

## Features

### Task List View
- Real-time task listing from Camunda
- Shows task name, assignee, creation date, due date, priority
- Process definition name display
- Quick claim/unclaim buttons

### Task Filters
- **Assignee Filter**: All Tasks, My Tasks, Unassigned
- **Process Filter**: Filter by process definition
- **Search**: Search tasks by name

### Task Details Panel
- Opens on task selection
- Shows full task information
- Displays and edits task variables
- Complete task with variable updates
- Shows process instance information

## Quick Win Benefits

1. **Immediate Access**: Tasks available directly in NetBuild
2. **Familiar UI**: Consistent with NetBuild's design
3. **No Context Switching**: Stay in NetBuild while managing Camunda tasks
4. **Real-time Updates**: Tasks refresh automatically after actions

## User Experience

1. Click "Tasklist" in sidebar
2. View all active tasks
3. Filter by assignment or process
4. Click task to see details
5. Claim unassigned tasks
6. Edit variables and complete tasks

## Technical Details

### Camunda REST API Usage
- Base URL: `http://localhost:8080/engine-rest`
- No authentication required (demo setup)
- Direct API calls from Next.js backend

### React Implementation
- Server-side API routes for security
- Client-side components with hooks
- Real-time updates on task actions
- Responsive design matching NetBuild

## Future Enhancements

1. **Custom Forms**: Support for Camunda embedded forms
2. **Task Comments**: Add commenting functionality
3. **Task History**: Show task completion history
4. **Batch Operations**: Select and act on multiple tasks
5. **Advanced Filters**: More filter options (date range, priority)
6. **Notifications**: Alert users of new task assignments

## Migration from Camunda Tasklist

This integration provides core functionality equivalent to Camunda's built-in tasklist:
- ✅ Task listing and filtering
- ✅ Task assignment (claim/unclaim)
- ✅ Task completion
- ✅ Variable editing
- ⚠️ Custom forms (basic support)
- ❌ Task comments (not yet implemented)
- ❌ Task delegation (not yet implemented)

## Testing with Demo Users

1. Login to NetBuild with any user
2. Navigate to a domain
3. Click "Tasklist" in sidebar
4. Demo tasks from Camunda will appear
5. Use demo/john/mary/peter as assignees