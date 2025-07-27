# Tasks Page Implementation Plan

## Overview
The Tasks page (`/app/tasks/page.tsx`) will provide a unified view of domain tasks and user-assigned tasks with tab-based navigation and filtering options.

**Note**: This implementation plan has been updated to reflect the unified schema where ALL tasks use the MasterTask model with ALL fields present (just empty when not used).

## Page Structure

### URL Routes
- `/tasks` - Main tasks page (redirects to domain-specific URL if domain is set)
- `/[domain]/tasks` - Domain-specific tasks page

### Component Hierarchy
```
TasksPage
├── TaskTabs (Chip-based tabs)
│   ├── Domain Tab
│   └── Assigned Tab
├── AssignmentToggle (Only visible in Assigned tab)
│   ├── "to me" (default)
│   └── "by me"
└── TaskList
    └── TaskCard (reusable from PostCard or new component)
```

## State Management

### Local State
```typescript
const [activeTab, setActiveTab] = useState<'domain' | 'assigned'>('domain');
const [assignmentFilter, setAssignmentFilter] = useState<'to-me' | 'by-me'>('to-me');
const [domainTasks, setDomainTasks] = useState<IMasterTask[]>([]); // Domain tasks (userId is empty string)
const [userTasks, setUserTasks] = useState<IMasterTask[]>([]);     // User tasks (userId has value)
const [isLoading, setIsLoading] = useState(true);
```

### Context Dependencies
- `useAuth()` - For current user ID and access token
- `useDomain()` - For current domain context
- `useRouter()` - For navigation

## API Integration

### Endpoints to Use

1. **Domain Tasks** (tasks where domain has value but userId is empty string)
   ```typescript
   GET /api/domain-tasks/master?domain={domainId}
   Headers: { Authorization: `Bearer ${accessToken}` }
   ```

2. **User Tasks** (with unified schema - needs new endpoint)
   ```typescript
   // For "to me" filter - tasks where userId matches current user
   GET /api/tasks/assigned?filter=to-me&domain={domainId}
   
   // For "by me" filter - tasks where assignedBy matches current user
   GET /api/tasks/assigned?filter=by-me&domain={domainId}
   
   Headers: { Authorization: `Bearer ${accessToken}` }
   ```
   
   **New Endpoint Implementation** (`/api/tasks/assigned/route.ts`):
   ```typescript
   // Query based on filter parameter
   const filter = searchParams.get('filter');
   const domainId = searchParams.get('domain');
   
   let query: any = { domain: domainId };
   
   if (filter === 'to-me') {
     query.userId = userId; // Tasks where userId matches current user
   } else if (filter === 'by-me') {
     query.assignedBy = userId; // Tasks where assignedBy matches current user
     query.userId = { $ne: userId }; // Exclude self-assignments
   }
   
   const tasks = await MasterTask.find(query)
     .sort({ timestampAssigned: -1 })
     .lean();
   ```

## UI Components

### 1. Tab Navigation
```typescript
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setActiveTab('domain')}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
      activeTab === 'domain' 
        ? "bg-blue-100 text-blue-700" 
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    )}
  >
    Domain
  </button>
  <button
    onClick={() => setActiveTab('assigned')}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
      activeTab === 'assigned' 
        ? "bg-blue-100 text-blue-700" 
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    )}
  >
    Assigned
  </button>
</div>
```

### 2. Assignment Toggle (Only shown when activeTab === 'assigned')
```typescript
{activeTab === 'assigned' && (
  <div className="flex gap-2 mb-4">
    <button
      onClick={() => setAssignmentFilter('to-me')}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
        assignmentFilter === 'to-me'
          ? "bg-gray-900 text-white"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
      )}
    >
      to me
    </button>
    <button
      onClick={() => setAssignmentFilter('by-me')}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
        assignmentFilter === 'by-me'
          ? "bg-gray-900 text-white"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
      )}
    >
      by me
    </button>
  </div>
)}
```

### 3. Task List Display
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {tasks.map(task => (
    <TaskCard
      key={task.id}
      task={task}
      onClick={() => handleTaskClick(task)}
      showAssignmentInfo={activeTab === 'assigned'}
    />
  ))}
</div>
```

## Data Fetching Logic

### fetchDomainTasks Implementation
```typescript
const fetchDomainTasks = async () => {
  try {
    setIsLoading(true);
    const response = await fetch(
      `/api/domain-tasks/master?domain=${currentDomain.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const data = await response.json();
    // Data will be MasterTask objects with domain field but no userId
    setDomainTasks(data.posts || []); // API returns as 'posts' for backward compatibility
  } catch (error) {
    console.error('Error fetching domain tasks:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### fetchUserTasks Implementation
```typescript
const fetchUserTasks = async () => {
  try {
    setIsLoading(true);
    const filter = assignmentFilter === 'to-me' ? 'to-me' : 'by-me';
    const response = await fetch(
      `/api/tasks/assigned?filter=${filter}&domain=${currentDomain.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const data = await response.json();
    // Data will be MasterTask objects with both domain and userId fields
    setUserTasks(data.tasks || []);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### useEffect Hooks
```typescript
useEffect(() => {
  if (activeTab !== 'domain' || !currentDomain || !accessToken) return;
  fetchDomainTasks();
}, [activeTab, currentDomain, accessToken]);

useEffect(() => {
  if (activeTab !== 'assigned' || !currentDomain || !accessToken || !user) return;
  fetchUserTasks();
}, [activeTab, assignmentFilter, currentDomain, accessToken, user]);
```

## Task Card Information

### Domain Tab Cards Should Display:
- Title
- Description (truncated)
- Task type icon
- Priority badge
- Estimated time
- Category (required/recommended/optional)
- CTA button text

### Assigned Tab Cards Should Display:
- Title
- Description (truncated)
- Task type icon
- Assignment info:
  - "Assigned by: [name]" (for "to me" view)
  - "Assigned to: [name]" (for "by me" view)
  - Assignment date
- Status (active/completed)
- Progress indicator (if applicable)

## Loading States

1. **Initial Load**: Show skeleton cards or spinner
2. **Tab Switch**: Show loading overlay on task grid
3. **Empty States**:
   - Domain Tab: "No tasks available for this domain"
   - Assigned "to me": "No tasks assigned to you"
   - Assigned "by me": "You haven't assigned any tasks"

## Error Handling

1. **API Failures**: Show error message with retry button
2. **No Domain Selected**: Redirect to `/domains`
3. **Unauthorized**: Redirect to login

## Click Actions

### Domain Tab
```typescript
const handleDomainTaskClick = async (task: IMasterTask) => {
  try {
    // Assign task to self using unified schema
    const response = await fetch('/api/domain-tasks/assign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId: task._id })
    });
    
    if (response.ok) {
      const { userTaskId } = await response.json();
      // Create execution and navigate to chat
      const execResponse = await fetch(`/api/domain-tasks/${userTaskId}/task-execution`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (execResponse.ok) {
        const { executionId } = await execResponse.json();
        router.push(`/chat/${executionId}`);
      }
    }
  } catch (error) {
    console.error('Error assigning task:', error);
  }
};
```

### Assigned Tab
```typescript
const handleUserTaskClick = async (task: IMasterTask) => {
  // For user tasks, check if execution exists or create new one
  try {
    const response = await fetch(`/api/domain-tasks/${task._id}/task-execution`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const { executionId } = await response.json();
      router.push(`/chat/${executionId}`);
    }
  } catch (error) {
    console.error('Error starting task execution:', error);
  }
};
```

## Responsive Design

- Mobile: Single column, full-width cards
- Tablet: 2 columns
- Desktop: 3 columns
- Tabs and toggles should be touch-friendly on mobile

## Performance Considerations

1. **Pagination**: Implement pagination or infinite scroll for large task lists
2. **Caching**: Cache domain tasks as they change less frequently
3. **Optimistic Updates**: When assigning tasks, update UI immediately

## Accessibility

1. **Keyboard Navigation**: Tab through tabs and cards
2. **ARIA Labels**: Proper labels for tabs and toggles
3. **Focus Management**: Maintain focus when switching tabs
4. **Screen Reader Support**: Announce tab changes and loading states

## Implementation Notes with Unified Schema

### Key Points
1. **Single Collection**: All tasks are in the `masterTasks` collection
2. **ALL Fields Present**: Every field exists in every document (empty strings, empty arrays, or null when not used)
3. **Domain Tasks**: Filter by `{ domain: domainId, userId: '' }`
4. **User Tasks**: Filter by `{ userId: currentUserId, domain: domainId }` or `{ assignedBy: currentUserId, domain: domainId }`
5. **Simple Assignment**: Copy domain task and fill in user fields

### Type Definitions
```typescript
import MasterTask, { IMasterTask } from '@/app/models/MasterTask';

// Domain tasks and user tasks are both IMasterTask
// Differentiated by presence of optional fields
```

## Future Enhancements

1. **Search/Filter**: Add search bar and filters (by type, priority, etc.)
2. **Bulk Actions**: Select multiple tasks for bulk assignment
3. **Sort Options**: Sort by date, priority, name
4. **Task Templates**: Quick-create tasks from templates
5. **Export**: Export task lists to CSV/PDF