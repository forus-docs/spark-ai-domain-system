'use client';

import { format } from 'date-fns';
import { 
  Clock, 
  User, 
  AlertCircle, 
  Calendar,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Task } from './TaskListContainer';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  currentUser: string;
}

export function TaskCard({
  task,
  isSelected,
  onSelect,
  currentUser,
}: TaskCardProps) {
  const formatTaskName = (name: string) => {
    return name.replace(/\\n/g, ' ').trim();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 75) return 'text-red-600 bg-red-50';
    if (priority >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const isOverdue = task.due && new Date(task.due) < new Date();

  return (
    <div
      className={cn(
        "bg-white border rounded p-2 hover:shadow-sm transition-all cursor-pointer",
        isSelected && "border-blue-500 shadow",
        isOverdue && "border-red-200"
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col">
        {/* Task Name */}
        <h3 className="font-medium text-sm text-gray-900 leading-tight">
          {formatTaskName(task.name)}
        </h3>

        {/* Process Info */}
        <p className="text-xs text-gray-500 leading-tight">
          {task.processDefinitionName || task.processDefinitionId}
        </p>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-2 text-xs mt-0.5">
          {/* Created Date */}
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3 h-3" />
            {format(new Date(task.created), 'MMM d, HH:mm')}
          </span>

          {/* Assignee */}
          {task.assignee ? (
            <span className="flex items-center gap-1 text-gray-700">
              <User className="w-3 h-3" />
              {task.assignee}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-3 h-3" />
              Unassigned
            </span>
          )}

          {/* Due Date */}
          {task.due && (
            <span className={cn(
              "flex items-center gap-1",
              isOverdue ? "text-red-600 font-medium" : "text-gray-500"
            )}>
              <Calendar className="w-3 h-3" />
              Due: {format(new Date(task.due), 'MMM d, yyyy')}
            </span>
          )}

          {/* Priority */}
          {task.priority > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs",
              getPriorityColor(task.priority)
            )}>
              Priority: {task.priority}
            </span>
          )}

          {/* Claim/Unclaim chip at the end */}
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
                    window.location.reload(); // Refresh to show updated task
                  }
                } catch (error) {
                  console.error('Failed to claim task:', error);
                }
              }}
              className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
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
                    window.location.reload(); // Refresh to show updated task
                  }
                } catch (error) {
                  console.error('Failed to unclaim task:', error);
                }
              }}
              className="ml-auto px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              Unclaim
            </button>
          ) : null}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}