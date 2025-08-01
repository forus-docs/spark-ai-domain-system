# Camunda 7 Tasklist Full Implementation Plan for NetBuild BPM

## Executive Summary

This plan outlines the complete implementation of Camunda 7 Tasklist features within NetBuild's BPM domain. The implementation will maintain clear separation between NetBuild and Camunda while providing full feature parity with the native Camunda Tasklist. The project is structured as a 10-week implementation with 6 major phases.

## Current State

### What's Already Implemented
- **BPM Domain**: Special domain slug "bpm" triggers BPM-specific functionality
- **BPM Sidebar**: Orange-themed sidebar with Camunda branding
- **User Switching**: Hardcoded demo users (demo, john, mary, peter)
- **Basic Tasklist**: Simple task list with claim/unclaim functionality
- **API Proxy**: NetBuild API routes proxy to Camunda REST API
- **Authentication Bridge**: Dual auth system (NetBuild JWT + Camunda Basic Auth)

### What's Missing
- Advanced filtering and saved filters
- Full form rendering (only basic forms work)
- Task history and audit trail
- Process diagram visualization
- Batch operations
- Real-time updates
- Mobile optimization
- Comments and attachments
- Variable management

## Implementation Phases

## Phase 1: Core Task Management (Week 1-2)

### 1.1 Enhanced Task List View
**Components to Create:**
```typescript
/app/components/tasklist/core/
├── TaskListContainer.tsx      // Main container with pagination
├── TaskCard.tsx               // Enhanced task display
├── TaskTableView.tsx          // Table view option
├── TaskListHeader.tsx         // Sorting and view controls
└── TaskPagination.tsx         // Pagination controls
```

**Features:**
- Task list with card and table view toggle
- Sorting options:
  - Created date (asc/desc)
  - Due date (asc/desc)
  - Follow-up date (asc/desc)
  - Priority (asc/desc)
  - Task name (asc/desc)
  - Assignee (asc/desc)
- Pagination:
  - Page size selector (10/25/50/100)
  - Page navigation
  - Total count display
- Task count badge
- Auto-refresh toggle (5s/10s/30s/off)
- Bulk selection checkboxes

**API Endpoints to Create:**
```typescript
// Enhanced task list endpoint
POST /api/camunda/tasks/list
Body: {
  filters: {...},
  sorting: { field: string, order: 'asc' | 'desc' },
  pagination: { page: number, size: number }
}

// Task count endpoint
POST /api/camunda/tasks/count
Body: { filters: {...} }

// Batch operations
POST /api/camunda/tasks/batch
Body: { 
  taskIds: string[], 
  operation: 'claim' | 'unclaim' | 'delegate',
  userId?: string 
}
```

### 1.2 Advanced Task Filters
**Components to Create:**
```typescript
/app/components/tasklist/filters/
├── FilterSidebar.tsx          // Collapsible filter panel
├── SavedFiltersList.tsx       // User's saved filters
├── FilterBuilder.tsx          // Visual filter builder
├── FilterCriteria/
│   ├── TextFilter.tsx         // Name, description filters
│   ├── UserFilter.tsx         // Assignee, candidate filters
│   ├── ProcessFilter.tsx      // Process definition filters
│   ├── DateRangeFilter.tsx    // Date-based filters
│   ├── VariableFilter.tsx     // Process variable filters
│   └── StateFilter.tsx        // Task state filters
└── FilterPreview.tsx          // Preview filter results
```

**Filter Criteria Implementation:**
- **Text Filters**:
  - Task name (contains/equals/starts with/ends with)
  - Description (contains/equals)
  - Process instance business key
- **User Filters**:
  - Assigned to me
  - Unassigned
  - Assigned to specific user
  - Candidate user (specific user)
  - Candidate group (specific group)
- **Process Filters**:
  - Process definition key
  - Process definition name
  - Process instance ID
  - Task definition key
- **Date Filters**:
  - Created (before/after/between)
  - Due date (before/after/between/today/overdue)
  - Follow-up date (before/after/between)
- **Priority Filter**:
  - Priority range (0-100)
  - High (>75), Medium (50-75), Low (<50)
- **Variable Filters**:
  - Variable name
  - Variable value (equals/contains/greater/less)
  - Variable type
- **State Filters**:
  - Active/Suspended
  - With/Without due date
  - With/Without follow-up

**Saved Filters Features:**
- Create new filter with name and criteria
- Update existing filter
- Delete filter
- Set as default filter
- Share filter (private/public)
- Filter permissions (who can see/edit)

**API Endpoints:**
```typescript
// Filter CRUD
GET    /api/camunda/filters
POST   /api/camunda/filters
PUT    /api/camunda/filters/:id
DELETE /api/camunda/filters/:id

// Execute filter
POST   /api/camunda/filters/:id/execute
Body: { 
  pagination: { page: number, size: number },
  sorting: { field: string, order: string }
}

// Share filter
POST   /api/camunda/filters/:id/share
Body: { 
  type: 'private' | 'public',
  permissions: { users: string[], groups: string[] }
}
```

### 1.3 Task Search
**Components to Create:**
```typescript
/app/components/tasklist/search/
├── TaskSearchBar.tsx          // Global search input
├── SearchResults.tsx          // Search results dropdown
├── SearchHistory.tsx          // Recent searches
└── QuickFilters.tsx          // Convert search to filter
```

**Features:**
- Full-text search across:
  - Task name
  - Task description
  - Process instance business key
- Search within current filter results
- Search history (last 10 searches)
- Convert search to saved filter
- Search suggestions/autocomplete

## Phase 2: Task Details & Forms (Week 3-4)

### 2.1 Task Details Panel
**Components to Create:**
```typescript
/app/components/tasklist/details/
├── TaskDetailsPanel.tsx       // Main sliding panel
├── TaskMetadata.tsx           // Task properties display
├── TaskActions.tsx            // Action button group
├── TaskDiagram.tsx            // Mini process diagram
├── InlineEditors/
│   ├── AssigneeEditor.tsx     // Change assignee
│   ├── DueDateEditor.tsx      // Edit due date
│   ├── PriorityEditor.tsx     // Edit priority
│   └── DescriptionEditor.tsx  // Edit description
└── TaskBreadcrumb.tsx         // Process > Instance > Task
```

**Task Properties Display:**
- Task ID and name
- Process definition name and version
- Process instance ID (link to Cockpit)
- Business key
- Task definition key
- Created date and time
- Due date (editable)
- Follow-up date (editable)
- Priority (editable with slider)
- Assignee (editable with user picker)
- Candidate users and groups
- Delegation state
- Parent task (if subtask)
- Suspension state

**Inline Editing Features:**
- Click to edit assignee (with user search)
- Click to edit due date (with calendar)
- Click to edit follow-up date
- Click to edit priority (0-100 slider)
- Click to edit description (rich text)
- Save/Cancel buttons for each edit

### 2.2 Form Rendering System
**Components to Create:**
```typescript
/app/components/tasklist/forms/
├── FormRenderer.tsx           // Main form controller
├── FormTypes/
│   ├── CamundaFormRenderer.tsx    // Camunda Forms (JSON)
│   ├── EmbeddedFormRenderer.tsx   // HTML forms
│   ├── ExternalFormRenderer.tsx   // External URL forms
│   └── GenericFormRenderer.tsx    // Variable-based forms
├── FormFields/
│   ├── TextField.tsx          // Text input
│   ├── NumberField.tsx        // Number input
│   ├── BooleanField.tsx       // Checkbox/toggle
│   ├── DateField.tsx          // Date picker
│   ├── SelectField.tsx        // Dropdown
│   ├── RadioField.tsx         // Radio buttons
│   ├── TextareaField.tsx      // Multi-line text
│   ├── FileField.tsx          // File upload
│   └── CustomField.tsx        // Extension point
├── FormValidation/
│   ├── RequiredValidator.tsx  
│   ├── PatternValidator.tsx   
│   ├── RangeValidator.tsx     
│   └── CustomValidator.tsx    
└── FormContext.tsx            // Form state management
```

**Form Type Detection:**
```typescript
interface FormConfig {
  formKey?: string;          // Detect form type
  formFields?: any[];        // Camunda Forms
  formData?: string;         // Embedded HTML
  externalFormUrl?: string;  // External form
}

// Form key patterns:
// "camunda-forms:bpmn:..." -> Camunda Forms
// "embedded:app:..." -> Embedded form
// "embedded:deployment:..." -> Deployed form
// URL -> External form
// null/undefined -> Generic form
```

**Camunda Forms Support:**
- All standard components
- Custom properties
- Validation rules
- Conditional logic (show/hide)
- Expression evaluation
- Data binding

**Generic Form Features:**
- Auto-generate from variables
- Type detection
- Basic validation
- Add/Remove variables
- Variable type selector

### 2.3 Process Variables
**Components to Create:**
```typescript
/app/components/tasklist/variables/
├── VariableList.tsx           // Variable table
├── VariableEditor.tsx         // Add/Edit modal
├── VariableTypeSelector.tsx   // Type dropdown
├── VariableHistory.tsx        // Change history
├── VariableViewers/
│   ├── StringViewer.tsx       
│   ├── NumberViewer.tsx       
│   ├── BooleanViewer.tsx      
│   ├── DateViewer.tsx         
│   ├── JsonViewer.tsx         // JSON with syntax highlight
│   ├── XmlViewer.tsx          // XML with syntax highlight
│   ├── ObjectViewer.tsx       // Serialized objects
│   └── FileViewer.tsx         // Binary/File preview
└── VariableScope.tsx          // Scope selector
```

**Variable Management Features:**
- View all variables (task/execution/process scopes)
- Add new variable with type
- Edit variable value (based on type)
- Delete variable
- Variable history (who changed what when)
- Download binary variables
- Copy variable value
- Search/filter variables

**API Endpoints:**
```typescript
// Get variables
GET /api/camunda/tasks/:taskId/variables
GET /api/camunda/tasks/:taskId/variables/:name

// Create/Update variable
PUT /api/camunda/tasks/:taskId/variables/:name
Body: { value: any, type: string, valueInfo?: any }

// Delete variable
DELETE /api/camunda/tasks/:taskId/variables/:name

// Get variable history
GET /api/camunda/tasks/:taskId/variables/:name/history
```

## Phase 3: Task Operations (Week 5)

### 3.1 Task Actions
**Components to Create:**
```typescript
/app/components/tasklist/actions/
├── TaskActionBar.tsx          // Main action toolbar
├── CompleteAction.tsx         // Complete with validation
├── ClaimAction.tsx            // Claim/Unclaim toggle
├── DelegateModal.tsx          // Delegate dialog
├── CommentModal.tsx           // Add comment dialog
├── DueDateModal.tsx           // Set due date dialog
├── SubtaskModal.tsx           // Create subtask dialog
└── TaskLinkCopy.tsx           // Copy task URL
```

**Core Actions Implementation:**
- **Complete**: Validate form → Submit variables → Complete task
- **Claim/Unclaim**: Toggle assignment with optimistic UI
- **Delegate**: Search users → Delegate → Update UI
- **Set Due Date**: Calendar picker → Save → Notification
- **Set Follow-up**: Calendar picker → Save → Calendar entry
- **Add Comment**: Rich text editor → Save → Show in history

**Extended Actions:**
- Create subtask
- Copy task link
- Export task data
- Print task details
- Add to calendar
- Set reminder

### 3.2 Task History & Audit
**Components to Create:**
```typescript
/app/components/tasklist/history/
├── TaskHistoryTimeline.tsx    // Main timeline view
├── HistoryEntry.tsx           // Individual entry
├── HistoryFilters.tsx         // Filter history
├── HistoryIcons.tsx           // Icon mappings
└── HistoryExport.tsx          // Export history
```

**History Events to Display:**
- Task created (who, when)
- Assignment changes (claim, unclaim, delegate)
- Priority changes
- Due date changes
- Variable updates (name, old value, new value)
- Comments added
- Attachments added/removed
- Form saved (draft)
- Task completed

**History Features:**
- Chronological timeline
- Filter by event type
- Filter by user
- Filter by date range
- Expand/collapse details
- Export as CSV/PDF

### 3.3 Task Comments & Attachments
**Components to Create:**
```typescript
/app/components/tasklist/comments/
├── CommentThread.tsx          // Comment list
├── CommentEditor.tsx          // Add/Edit comment
├── CommentItem.tsx            // Single comment
└── CommentActions.tsx         // Edit/Delete actions

/app/components/tasklist/attachments/
├── AttachmentList.tsx         // File list
├── AttachmentUpload.tsx       // Upload component
├── AttachmentPreview.tsx      // Preview modal
├── AttachmentItem.tsx         // Single file
└── AttachmentActions.tsx      // Download/Delete
```

**Comment Features:**
- Add comment with rich text (markdown)
- Edit own comments
- Delete own comments (soft delete)
- @mention users
- Comment threading/replies
- Comment search
- Comment notifications

**Attachment Features:**
- Drag & drop upload
- Multiple file upload
- File type restrictions
- Max size validation (10MB default)
- Image preview
- PDF preview
- Download files
- Delete files (with confirmation)
- Attachment metadata:
  - Filename, size, type
  - Upload date and user
  - Description

**API Endpoints:**
```typescript
// Comments
GET    /api/camunda/tasks/:taskId/comments
POST   /api/camunda/tasks/:taskId/comments
PUT    /api/camunda/tasks/:taskId/comments/:commentId
DELETE /api/camunda/tasks/:taskId/comments/:commentId

// Attachments
GET    /api/camunda/tasks/:taskId/attachments
POST   /api/camunda/tasks/:taskId/attachments
GET    /api/camunda/tasks/:taskId/attachments/:id
DELETE /api/camunda/tasks/:taskId/attachments/:id
```

## Phase 4: Process Integration (Week 6)

### 4.1 Process Context
**Components to Create:**
```typescript
/app/components/tasklist/process/
├── ProcessDiagram.tsx         // BPMN viewer
├── ProcessInstanceInfo.tsx    // Instance details
├── ProcessBreadcrumb.tsx      // Navigation trail
├── ActivityOverlay.tsx        // Current activity
├── TokenAnimation.tsx         // Process flow animation
└── SiblingTasks.tsx          // Other active tasks
```

**Process Diagram Features:**
- Render BPMN diagram using bpmn-js
- Highlight current task
- Show active tasks (green)
- Show completed tasks (grey)
- Click task to navigate
- Zoom and pan controls
- Full screen mode
- Export as image

**Process Instance Info:**
- Instance ID
- Business key
- Start time and duration
- Start user
- Super process instance (if exists)
- Current activities
- Variables summary
- Incidents (if any)
- Link to Cockpit

### 4.2 Start Process
**Components to Create:**
```typescript
/app/components/tasklist/start-process/
├── StartProcessButton.tsx     // Trigger button
├── ProcessListModal.tsx       // Process selector
├── ProcessStartForm.tsx       // Start form
├── ProcessCategories.tsx      // Category filter
├── ProcessFavorites.tsx       // Starred processes
└── RecentProcesses.tsx        // Recently started
```

**Start Process Features:**
- List all startable processes
- Filter by category
- Search processes
- Mark favorites
- Show version info
- Start with form
- Set business key
- Set initial variables
- Start and go to first task

**API Endpoints:**
```typescript
// Get startable processes
GET /api/camunda/process-definitions?latestVersion=true&startableByUser=true

// Start process
POST /api/camunda/process-definitions/:key/start
Body: {
  businessKey?: string,
  variables?: Record<string, any>
}

// Get start form
GET /api/camunda/process-definitions/:key/startForm
```

### 4.3 Standalone Tasks
**Components to Create:**
```typescript
/app/components/tasklist/standalone/
├── CreateTaskButton.tsx       // Create button
├── CreateTaskModal.tsx        // Creation form
├── TaskTemplate.tsx           // Task templates
└── StandaloneTaskForm.tsx     // Task properties
```

**Standalone Task Features:**
- Create task without process
- Set all properties:
  - Name (required)
  - Description
  - Assignee
  - Due date
  - Priority
  - Form key
- Add initial variables
- Task templates (save common configs)
- Assign to user or group

## Phase 5: Advanced Features (Week 7-8)

### 5.1 Batch Operations
**Components to Create:**
```typescript
/app/components/tasklist/batch/
├── BatchSelectionBar.tsx      // Selection counter
├── BatchActionMenu.tsx        // Available actions
├── BatchConfirmDialog.tsx     // Confirmation
├── BatchProgress.tsx          // Progress indicator
└── BatchResults.tsx           // Success/failure summary
```

**Batch Operations:**
- Select all (current page)
- Select all (matching filter)
- Batch actions:
  - Claim selected tasks
  - Unclaim selected tasks
  - Delegate to user
  - Set due date
  - Set priority
  - Add comment
  - Complete (same form only)
- Progress indication
- Error handling (partial success)

### 5.2 Notifications & Real-time Updates
**Components to Create:**
```typescript
/app/components/tasklist/realtime/
├── NotificationCenter.tsx     // Notification dropdown
├── NotificationItem.tsx       // Single notification
├── NotificationSettings.tsx   // Preferences
├── RealtimeIndicator.tsx     // Connection status
├── TaskUpdateHandler.tsx      // WebSocket handler
└── PresenceIndicator.tsx      // Who's viewing
```

**Notification Types:**
- New task assigned to you
- Task claim/unclaim
- Due date approaching (1 day, 1 hour)
- Task overdue
- Comment on your task
- Process incident
- Task completed by others

**Real-time Features:**
- WebSocket connection to Camunda
- Live task list updates
- Presence (who's viewing task)
- Typing indicators in comments
- Auto-refresh on changes
- Offline queue for actions

### 5.3 Mobile Optimization
**Components to Create:**
```typescript
/app/components/tasklist/mobile/
├── MobileLayout.tsx           // Responsive container
├── MobileTaskList.tsx         // Touch-optimized list
├── MobileTaskCard.tsx         // Swipeable cards
├── MobileFilters.tsx          // Bottom sheet filters
├── MobileActions.tsx          // Action sheet
└── MobileForm.tsx             // Mobile form layout
```

**Mobile Features:**
- Responsive breakpoints
- Touch gestures:
  - Swipe right to claim
  - Swipe left for actions
  - Pull to refresh
- Bottom sheets for filters
- Action sheets for operations
- Optimized form layout
- Offline mode with sync
- PWA capabilities:
  - Install prompt
  - Offline support
  - Push notifications

### 5.4 Keyboard Shortcuts
**Implementation:**
```typescript
// Global shortcuts
'/' - Focus search
'c' - Create filter
'r' - Refresh list
'?' - Show help

// List navigation
'j' - Next task
'k' - Previous task
'Enter' - Open task
'Space' - Select task

// Task actions
'c' - Claim task
'u' - Unclaim task
'd' - Delegate task
'Ctrl+Enter' - Complete task

// Bulk actions
'Ctrl+a' - Select all
'Escape' - Clear selection
```

## Phase 6: Integration & Polish (Week 9-10)

### 6.1 NetBuild Integration
**Tasks:**
- Unify authentication flow
- Consistent styling with NetBuild
- Domain-based task filtering
- Activity logging integration
- User preferences sync
- Navigation integration

### 6.2 Performance Optimization
**Optimizations:**
- Virtual scrolling for large lists
- Lazy loading task details
- Image lazy loading
- Code splitting by route
- Service worker caching
- Optimistic UI updates
- Debounced search
- Memoized components

### 6.3 Testing Suite
**Test Coverage:**
```typescript
/app/components/tasklist/__tests__/
├── unit/              // Component tests
├── integration/       // Feature tests
├── e2e/              // User flow tests
└── performance/      // Load tests
```

**Testing Strategy:**
- Unit tests for all components
- Integration tests for workflows
- E2E tests for critical paths
- Performance benchmarks
- Accessibility tests
- Mobile device tests

### 6.4 Documentation
**Documentation:**
```typescript
/documentation/tasklist/
├── user-guide.md      // End user documentation
├── api-reference.md   // API documentation
├── architecture.md    // Technical architecture
├── deployment.md      // Deployment guide
└── troubleshooting.md // Common issues
```

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **State Management**: React Context + React Query
- **Real-time**: Socket.IO client
- **Forms**: React Hook Form
- **BPMN Viewer**: bpmn-js
- **File Upload**: react-dropzone
- **Date Picker**: react-datepicker
- **Rich Text**: @tiptap/react

### API Architecture
```typescript
// Middleware stack
/api/camunda/*
├── authMiddleware      // JWT validation
├── proxyMiddleware     // Camunda proxy
├── errorMiddleware     // Error handling
└── logMiddleware       // Activity logging
```

### Data Flow
```
User Action → React Component → API Route → Camunda REST → Response → UI Update
                    ↓                              ↓
                WebSocket ← ─ ─ ─ ─ ─ ─ ─ Event Stream
```

### Caching Strategy
- React Query for API responses
- 5-minute cache for task lists
- 1-minute cache for task details
- Invalidate on mutations
- Optimistic updates

## Security Considerations

### Authentication
- NetBuild JWT required
- Camunda Basic Auth in header
- Session timeout handling
- Refresh token rotation

### Authorization
- Task visibility based on user
- Filter permissions
- Domain-based isolation
- Admin override capabilities

### Input Validation
- Form field validation
- File type restrictions
- File size limits
- XSS prevention
- SQL injection prevention

## Performance Targets

### Metrics
- Task list load: < 200ms
- Task detail load: < 150ms
- Form render: < 100ms
- Search response: < 300ms
- WebSocket latency: < 50ms

### Optimization Strategies
- Virtual scrolling for > 100 tasks
- Pagination default 25 items
- Lazy load images and files
- Compress API responses
- CDN for static assets

## Deployment Considerations

### Environment Variables
```env
CAMUNDA_REST_URL=http://localhost:8080/engine-rest
CAMUNDA_WEBSOCKET_URL=ws://localhost:8080/ws
MAX_FILE_SIZE=10485760  # 10MB
ENABLE_WEBSOCKET=true
CACHE_TTL=300  # 5 minutes
```

### Docker Configuration
- Separate container for WebSocket server
- Redis for session/cache storage
- Nginx for static file serving
- Health check endpoints

## Success Criteria

1. **Feature Parity**: 100% of Camunda Tasklist features
2. **Performance**: All operations < 300ms
3. **Mobile Score**: Lighthouse > 95
4. **Test Coverage**: > 90%
5. **Accessibility**: WCAG 2.1 AA compliant
6. **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)

## Risk Mitigation

### Technical Risks
- **Camunda API Changes**: Version lock to 7.20.0
- **Performance Issues**: Implement pagination early
- **Browser Compatibility**: Use Babel/PostCSS
- **WebSocket Stability**: Fallback to polling

### Project Risks
- **Scope Creep**: Strict phase gates
- **Timeline Slip**: 20% buffer per phase
- **Resource Availability**: Document all decisions

## Next Steps

1. Set up development environment
2. Create component scaffolding
3. Implement Phase 1.1 (Enhanced Task List)
4. Daily progress updates
5. Weekly demos to stakeholders

This comprehensive plan ensures NetBuild will have a world-class Camunda Tasklist implementation that maintains the clean separation between NetBuild and Camunda while providing a superior user experience.