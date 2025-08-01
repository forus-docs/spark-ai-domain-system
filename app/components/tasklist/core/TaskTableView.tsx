'use client';

import { format } from 'date-fns';
import { 
  ChevronUp, 
  ChevronDown,
  CheckSquare,
  Square,
  User,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Task, SortConfig } from './TaskListContainer';

interface TaskTableViewProps {
  tasks: Task[];
  selectedTaskId: string | null;
  selectedTasks: Set<string>;
  onTaskSelect: (taskId: string) => void;
  onTaskCheck: (taskId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  currentUser: string;
}

export function TaskTableView({
  tasks,
  selectedTaskId,
  selectedTasks,
  onTaskSelect,
  onTaskCheck,
  onSelectAll,
  sortConfig,
  onSort,
  currentUser,
}: TaskTableViewProps) {
  const allSelected = tasks.length > 0 && tasks.every(t => selectedTasks.has(t.id));
  const someSelected = tasks.some(t => selectedTasks.has(t.id));

  const SortIcon = ({ field }: { field: SortConfig['field'] }) => {
    if (sortConfig.field !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.order === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const formatTaskName = (name: string) => {
    return name.replace(/\\n/g, ' ').trim();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 75) return 'text-red-600';
    if (priority >= 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-3 py-3">
              <button
                onClick={() => onSelectAll(!allSelected)}
                className="flex items-center justify-center"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : someSelected ? (
                  <Square className="w-5 h-5 text-blue-600 fill-blue-100" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </th>
            <th className="px-3 py-3 text-left">
              <button
                onClick={() => onSort('name')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Task Name
                <SortIcon field="name" />
              </button>
            </th>
            <th className="px-3 py-3 text-left">
              <button
                onClick={() => onSort('assignee')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Assignee
                <SortIcon field="assignee" />
              </button>
            </th>
            <th className="px-3 py-3 text-left">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Process
              </span>
            </th>
            <th className="px-3 py-3 text-left">
              <button
                onClick={() => onSort('created')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Created
                <SortIcon field="created" />
              </button>
            </th>
            <th className="px-3 py-3 text-left">
              <button
                onClick={() => onSort('due')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Due Date
                <SortIcon field="due" />
              </button>
            </th>
            <th className="px-3 py-3 text-left">
              <button
                onClick={() => onSort('priority')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Priority
                <SortIcon field="priority" />
              </button>
            </th>
            <th className="px-3 py-3 text-right">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map(task => {
            const isOverdue = task.due && new Date(task.due) < new Date();
            
            return (
              <tr
                key={task.id}
                onClick={() => onTaskSelect(task.id)}
                className={cn(
                  "hover:bg-gray-50 cursor-pointer",
                  selectedTaskId === task.id && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <td className="px-3 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskCheck(task.id, !selectedTasks.has(task.id));
                    }}
                    className="flex items-center justify-center"
                  >
                    {selectedTasks.has(task.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {formatTaskName(task.name)}
                  </div>
                  {task.description && (
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="px-3 py-4">
                  {task.assignee ? (
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <User className="w-4 h-4" />
                      {task.assignee}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      Unassigned
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {task.processDefinitionName || task.processDefinitionId}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {format(new Date(task.created), 'MMM d, HH:mm')}
                </td>
                <td className="px-3 py-4 text-sm">
                  {task.due ? (
                    <span className={cn(
                      isOverdue && "text-red-600 font-medium"
                    )}>
                      {format(new Date(task.due), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-sm">
                  {task.priority > 0 ? (
                    <span className={cn("font-medium", getPriorityColor(task.priority))}>
                      {task.priority}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-right text-sm">
                  {!task.assignee ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const response = await fetch(`/api/camunda/tasks/${task.id}/claim`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: currentUser }),
                          });
                          if (response.ok) {
                            window.location.reload();
                          }
                        } catch (error) {
                          console.error('Failed to claim task:', error);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Claim
                    </button>
                  ) : task.assignee === currentUser ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const response = await fetch(`/api/camunda/tasks/${task.id}/claim`, {
                            method: 'DELETE',
                          });
                          if (response.ok) {
                            window.location.reload();
                          }
                        } catch (error) {
                          console.error('Failed to unclaim task:', error);
                        }
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Unclaim
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}