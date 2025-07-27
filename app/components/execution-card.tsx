import { Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionCardProps {
  execution: {
    executionId: string;
    title: string;
    updatedAt: string;
    createdAt: string;
    lastMessage?: {
      content: string;
      role: string;
      createdAt: string;
    } | null;
    messageCount: number;
  };
  onClick: () => void;
}

export function ExecutionCard({ execution, onClick }: ExecutionCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">
          {execution.title}
        </h3>
        <span className="flex items-center text-xs text-gray-500 ml-2">
          <MessageSquare className="w-3 h-3 mr-1" />
          {execution.messageCount}
        </span>
      </div>
      
      {execution.lastMessage && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {execution.lastMessage.role === 'user' ? 'You: ' : 'AI: '}
          {execution.lastMessage.content}
        </p>
      )}
      
      <div className="flex items-center text-xs text-gray-500">
        <Clock className="w-3 h-3 mr-1" />
        {formatDistanceToNow(new Date(execution.updatedAt), { addSuffix: true })}
      </div>
    </div>
  );
}