/**
 * Wrapper component for the workstream chat interface
 */

'use client';

import { WorkstreamChatInterface } from './workstream-chat-interface';
import { useAuth } from '@/app/contexts/auth-context';

interface ChatInterfaceWrapperProps {
  taskExecution: any;
  executionId: string;
  onClose: () => void;
}

export function ChatInterfaceWrapper({ taskExecution, executionId, onClose }: ChatInterfaceWrapperProps) {
  const { accessToken } = useAuth();
  
  // Extract the props needed for chat interface
  const chatProps = {
    executionId: taskExecution.executionId,
    masterTaskName: taskExecution.taskSnapshot?.title || taskExecution.title || 'Task Execution',
    executionModel: taskExecution.taskSnapshot?.executionModel || taskExecution.executionModel,
    userTaskId: taskExecution.userTaskId,
    onClose,
    accessToken: accessToken || undefined,
    taskSnapshot: taskExecution.taskSnapshot,
  };

  return <WorkstreamChatInterface {...chatProps} />;
}