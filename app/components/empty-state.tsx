import { cn } from '@/app/lib/utils';
import { FileText, Users, CheckSquare, BarChart3, FolderTree, Workflow, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  workstreams: Workflow,
  organogram: FolderTree,
  teams: Users,
  procedures: FileText,
  tasks: CheckSquare,
  dashboards: BarChart3,
};

export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  // Try to get icon from title if not provided
  const Icon = icon || iconMap[title.toLowerCase()] || FileText;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4",
      "text-center",
      className
    )}>
      <div className="mb-6 p-4 bg-gray-100 rounded-full">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-light text-gray-900 mb-2">
        {title} Coming Soon
      </h2>
      
      <p className="text-gray-600 max-w-md">
        {description || 'This feature is currently under development and will be available in the next phase.'}
      </p>
      
      <div className="mt-8 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm text-gray-500 font-medium">Sprint 1 - Stubbed Content</span>
      </div>
    </div>
  );
}