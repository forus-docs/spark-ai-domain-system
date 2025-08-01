'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, User, Clock, Calendar, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

interface TaskDetailsProps {
  taskId: string;
  onClose: () => void;
  onTaskComplete: () => void;
  currentUser: string;
  isMobile?: boolean;
}

interface TaskData {
  task: any;
  variables: any;
  form: any;
  processInstance: any;
}

export function TaskDetails({
  taskId,
  onClose,
  onTaskComplete,
  currentUser,
  isMobile = false,
}: TaskDetailsProps) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completing, setCompleting] = useState(false);
  
  // Auto-detect mobile if not provided
  const [isMobileView, setIsMobileView] = useState(isMobile);
  
  useEffect(() => {
    if (!isMobile) {
      const checkMobile = () => {
        setIsMobileView(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/camunda/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task details');
      }

      const data = await response.json();
      setTaskData(data);

      // Initialize form data with task variables
      if (data.variables) {
        const initialFormData: Record<string, any> = {};
        Object.entries(data.variables).forEach(([key, variable]: [string, any]) => {
          initialFormData[key] = variable.value;
        });
        setFormData(initialFormData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!taskData?.task.assignee || taskData.task.assignee !== currentUser) {
      setError('You must claim this task before completing it');
      return;
    }

    try {
      setCompleting(true);
      setError(null);

      // Convert form data to Camunda variable format
      const variables: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        variables[key] = {
          value,
          type: typeof value === 'boolean' ? 'Boolean' : 
                typeof value === 'number' ? 'Integer' : 'String'
        };
      });

      const response = await fetch(`/api/camunda/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      onTaskComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCompleting(false);
    }
  };

  const formatTaskName = (name: string) => {
    return name.replace(/\\n/g, ' ');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!taskData) {
    return null;
  }

  const { task, variables, form, processInstance } = taskData;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-4">
            {isMobileView && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {formatTaskName(task.name)}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.assignee || 'Unassigned'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.created), 'MMM d')}
                </span>
              </div>
            </div>
            {!isMobileView && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Process Information */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Process Information</h3>
          <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
            <div>
              <span className="text-gray-500">Process:</span>{' '}
              {processInstance?.definitionId || task.processDefinitionId}
            </div>
            <div>
              <span className="text-gray-500">Instance:</span>{' '}
              {task.processInstanceId}
            </div>
            {processInstance?.businessKey && (
              <div>
                <span className="text-gray-500">Business Key:</span>{' '}
                {processInstance.businessKey}
              </div>
            )}
          </div>
        </div>

        {/* Task Variables */}
        {Object.keys(variables).length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Task Data</h3>
            <div className="space-y-3">
              {Object.entries(variables).map(([key, variable]: [string, any]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key}
                  </label>
                  {variable.type === 'Boolean' ? (
                    <input
                      type="checkbox"
                      checked={formData[key] || false}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.checked })
                      }
                      disabled={task.assignee !== currentUser}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      disabled={task.assignee !== currentUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Information */}
        {form && form.key && (
          <div className="mb-6">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Form
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              This task has a custom form: {form.key}
              <br />
              Custom forms are not yet supported in this UI.
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t bg-gray-50">
        {task.assignee === currentUser ? (
          <button
            onClick={handleCompleteTask}
            disabled={completing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {completing ? 'Completing...' : 'Complete Task'}
          </button>
        ) : (
          <div className="text-center text-sm text-gray-500">
            {task.assignee
              ? `This task is assigned to ${task.assignee}`
              : 'Claim this task to complete it'}
          </div>
        )}
      </div>
    </div>
  );
}