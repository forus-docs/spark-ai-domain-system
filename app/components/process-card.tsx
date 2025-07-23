'use client';

import { cn } from '@/app/lib/utils';
import { FileText, Workflow, Brain, GitBranch, GraduationCap } from 'lucide-react';

interface ProcessCardProps {
  process: {
    id: string;
    name: string;
    executionModel: 'form' | 'sop' | 'knowledge' | 'bpmn' | 'training';
    description: string;
    currentStage: 'manual' | 'assisted' | 'supervised' | 'automated' | 'ai_promoted';
    aiAgentAttached?: boolean;
    aiAgentRole?: string;
  };
  onClick?: () => void;
}

const executionModelIcons = {
  form: FileText,
  sop: Workflow,
  knowledge: Brain,
  bpmn: GitBranch,
  training: GraduationCap,
};

const executionModelLabels = {
  form: 'Form Based',
  sop: 'Standard Operating Procedure',
  knowledge: 'Knowledge Work',
  bpmn: 'Business Process',
  training: 'Training Module',
};

const stageColors = {
  manual: 'bg-gray-100 text-gray-700',
  assisted: 'bg-blue-100 text-blue-700',
  supervised: 'bg-purple-100 text-purple-700',
  automated: 'bg-green-100 text-green-700',
  ai_promoted: 'bg-emerald-100 text-emerald-700',
};

const stageLabels = {
  manual: 'Manual',
  assisted: 'AI Assisted',
  supervised: 'AI Supervised',
  automated: 'Automated',
  ai_promoted: 'AI Promoted',
};

export function ProcessCard({ process, onClick }: ProcessCardProps) {
  const Icon = executionModelIcons[process.executionModel];
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-3",
        "hover:shadow-md hover:border-gray-300 transition-all duration-200",
        "cursor-pointer group",
        "active:scale-[0.98]" // Touch feedback
      )}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-gray-800 text-sm">
            {process.name}
          </h3>
        </div>
      </div>

      {/* Execution Type */}
      <p className="text-xs text-gray-500 mb-1.5">
        {executionModelLabels[process.executionModel]}
      </p>

      {/* Stage Badge - moved below execution type */}
      <div className={cn(
        "inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium",
        stageColors[process.currentStage]
      )}>
        {stageLabels[process.currentStage]}
      </div>
    </div>
  );
}