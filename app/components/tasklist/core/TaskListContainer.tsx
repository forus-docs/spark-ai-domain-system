'use client';

import { useState, useEffect, useContext } from 'react';
import { TaskListHeader } from './TaskListHeader';
import { TaskCard } from './TaskCard';
import { TaskTableView } from './TaskTableView';
import { TaskPagination } from './TaskPagination';
import { RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { CamundaContext } from '@/app/contexts/camunda-context';
import { useKeycloakAuth } from '@/app/hooks/use-keycloak-auth';

export interface Task {
  id: string;
  name: string;
  assignee: string | null;
  created: string;
  due: string | null;
  followUp: string | null;
  priority: number;
  processDefinitionId: string;
  processDefinitionName?: string;
  processInstanceId: string;
  taskDefinitionKey?: string;
  description?: string;
}

export interface Filter {
  id: string;
  name: string;
  owner: string;
  query: any;
  properties: {
    priority?: number;
    description?: string;
    refresh?: boolean;
    variables?: any[];
  };
  resourceType: string;
}

export interface SortConfig {
  field: 'created' | 'due' | 'followUp' | 'priority' | 'name' | 'assignee';
  order: 'asc' | 'desc';
}

interface TaskListContainerProps {
  filters: any;
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  currentUser: string;
  selectedFilterId?: string | null;
  selectedFilter?: Filter | null;
}

export function TaskListContainer({
  filters,
  selectedTaskId,
  onTaskSelect,
  currentUser,
  selectedFilterId,
  selectedFilter,
}: TaskListContainerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created',
    order: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0,
  });
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval] = useState(10000); // 10 seconds default

  // Check if filter has auto-refresh enabled
  useEffect(() => {
    if (selectedFilter?.properties?.refresh) {
      setAutoRefreshEnabled(true);
    } else {
      setAutoRefreshEnabled(false);
    }
  }, [selectedFilter]);

  // Try to get Camunda context (may be undefined if not in BPM domain)
  const camundaContext = useContext(CamundaContext);
  
  // Get Keycloak auth if available
  const { getCamundaAuthHeader, isKeycloakEnabled } = useKeycloakAuth();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth header - prefer Keycloak OAuth over Basic Auth
      const authHeader: HeadersInit = { 'Content-Type': 'application/json' };
      const keycloakAuthHeader = getCamundaAuthHeader();
      const camundaUser = camundaContext?.currentUser || null;
      
      if (keycloakAuthHeader) {
        authHeader['Authorization'] = keycloakAuthHeader;
        console.log('Using Keycloak OAuth authentication');
      } else {
        // Fallback to Basic Auth
        if (camundaUser) {
          authHeader['X-Camunda-Auth'] = btoa(`${camundaUser.username}:${camundaUser.password}`);
          console.log('Using Basic Auth for user:', camundaUser.username);
        } else {
          console.log('No authentication available');
        }
      }

      // If we have a selected filter, use filter-based API
      if (selectedFilterId) {
        // Fetch task count through filter
        const countResponse = await fetch(`/api/camunda/filters/${selectedFilterId}/count`, {
          method: 'GET',
          headers: authHeader,
          credentials: 'include',
        });

        if (countResponse.ok) {
          const { count } = await countResponse.json();
          setTotalCount(count);
          setPagination(prev => ({ ...prev, total: count }));
        }

        // Fetch tasks through filter
        const response = await fetch(`/api/camunda/filters/${selectedFilterId}/tasks`, {
          method: 'POST',
          headers: authHeader,
          credentials: 'include',
          body: JSON.stringify({
            sorting: sortConfig,
            pagination: {
              page: pagination.page,
              size: pagination.size,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);
      } else {
        // Fallback to direct task API
        // Fetch task count
        const countResponse = await fetch('/api/camunda/tasks/count', {
          method: 'POST',
          headers: authHeader,
          credentials: 'include',
          body: JSON.stringify({ 
            filters,
            currentUser: camundaUser?.username || currentUser 
          }),
        });

        if (countResponse.ok) {
          const { count } = await countResponse.json();
          setTotalCount(count);
          setPagination(prev => ({ ...prev, total: count }));
        }

        // Fetch tasks with pagination and sorting
        const response = await fetch('/api/camunda/tasks/list', {
          method: 'POST',
          headers: authHeader,
          credentials: 'include',
          body: JSON.stringify({
            filters,
            sorting: sortConfig,
            pagination: {
              page: pagination.page,
              size: pagination.size,
            },
            currentUser: camundaUser?.username || currentUser,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortConfig, pagination.page, pagination.size, selectedFilterId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTasks();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, autoRefreshInterval, filters, sortConfig, pagination.page, pagination.size, selectedFilterId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, page: 1, size }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelection = new Set(selectedTasks);
    if (checked) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    setSelectedTasks(newSelection);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              Tasks {totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalCount})
                </span>
              )}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "p-2 rounded-md hover:bg-gray-100 transition-colors",
                refreshing && "animate-spin"
              )}
              title="Refresh tasks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn(
                "p-2 rounded-md transition-colors",
                autoRefreshEnabled 
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                  : "hover:bg-gray-100"
              )}
              title={autoRefreshEnabled ? "Auto-refresh enabled (10s)" : "Enable auto-refresh"}
            >
              <Timer className={cn("w-4 h-4", autoRefreshEnabled && "animate-pulse")} />
            </button>
          </div>
          
          {!isMobile && (
            <TaskListHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortConfig={sortConfig}
              onSort={handleSort}
              selectedCount={selectedTasks.size}
              totalCount={tasks.length}
            />
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No tasks found</p>
          </div>
        ) : (isMobile || viewMode === 'card') ? (
          <div className="p-4 space-y-2">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => onTaskSelect(task.id)}
                currentUser={currentUser}
              />
            ))}
          </div>
        ) : (
          <TaskTableView
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            selectedTasks={selectedTasks}
            onTaskSelect={onTaskSelect}
            onTaskCheck={handleSelectTask}
            onSelectAll={handleSelectAll}
            sortConfig={sortConfig}
            onSort={handleSort}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Pagination */}
      {tasks.length > 0 && (
        <div className="border-t bg-white flex-shrink-0">
          <TaskPagination
            currentPage={pagination.page}
            pageSize={pagination.size}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}