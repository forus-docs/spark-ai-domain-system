'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';
import { useChat } from '@/app/contexts/chat-context';
import { useAuth } from '@/app/contexts/auth-context';
import { FileText, Workflow, Brain, GitBranch, GraduationCap, Bot, ArrowLeft } from 'lucide-react';
import { ChatInterfaceV2 } from '@/app/components/chat-interface-v2';
import { cn } from '@/app/lib/utils';
import { 
  mavenProcesses, 
  wowProcesses, 
  bemnetProcesses, 
  pacciProcesses 
} from '@/app/lib/sprint2-mock-data/process-mock-data';

const processMap: Record<string, any[]> = {
  'maven-hub': mavenProcesses,
  'wealth-on-wheels': wowProcesses,
  'bemnet': bemnetProcesses,
  'pacci': pacciProcesses,
};

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

export default function ProcessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentDomain } = useDomain();
  const { addChat } = useChat();
  const { accessToken } = useAuth();
  
  const [activeChat, setActiveChat] = useState<{
    processName: string;
    masterTaskId: string;
    executionModel: string;
    chatId?: string;
  } | null>(null);

  const domainId = params.domainId as string;
  const masterTaskId = params.masterTaskId as string;
  const startChat = searchParams.get('startChat');
  const chatId = searchParams.get('chatId');

  // Find the process
  const processes = processMap[domainId] || [];
  const process = processes.find(p => p.id === masterTaskId);

  // Auto-start chat if URL parameter is present
  useEffect(() => {
    if (startChat === 'true' && process && !activeChat) {
      if (chatId) {
        // Opening existing chat from recent items
        setActiveChat({
          processName: process.name,
          masterTaskId: process.id,
          executionModel: process.executionModel,
          chatId: chatId,
        });
      } else {
        // Creating new chat
        const newChat = addChat({
          domainId: currentDomain?.id || domainId,
          processName: process.name,
          masterTaskId: process.id,
          executionModel: process.executionModel,
        });
        
        // Open chat interface
        setActiveChat({
          processName: process.name,
          masterTaskId: process.id,
          executionModel: process.executionModel,
          chatId: newChat.id,
        });
      }
    }
  }, [startChat, chatId, process, activeChat, addChat, currentDomain?.id, domainId]);

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-gray-900 mb-2">Process Not Found</h1>
          <p className="text-gray-600 mb-4">The requested process could not be found.</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const Icon = executionModelIcons[process.executionModel as keyof typeof executionModelIcons];

  const handleStartProcess = () => {
    // Add to recent chats
    const newChat = addChat({
      domainId: currentDomain?.id || domainId,
      processName: process.name,
      masterTaskId: process.id,
      executionModel: process.executionModel,
    });
    
    // Open chat interface
    setActiveChat({
      processName: process.name,
      masterTaskId: process.id,
      executionModel: process.executionModel,
      chatId: newChat.id,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-lg font-light text-gray-900">{process.name}</h1>
                <p className="text-xs text-gray-500">{executionModelLabels[process.executionModel as keyof typeof executionModelLabels]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-4">
        {/* Status Badge */}
        <div className={cn(
          "inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-3",
          stageColors[process.currentStage as keyof typeof stageColors]
        )}>
          {stageLabels[process.currentStage as keyof typeof stageLabels]}
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-base font-medium text-gray-900 mb-2">Description</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{process.description}</p>
        </div>

        {/* Execution Model Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-base font-medium text-gray-900 mb-2">Execution Model</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{executionModelLabels[process.executionModel as keyof typeof executionModelLabels]}</p>
              <p className="text-sm text-gray-600">
                {process.executionModel === 'form' && 'Structured data collection with validation rules'}
                {process.executionModel === 'sop' && 'Step-by-step procedures with compliance tracking'}
                {process.executionModel === 'knowledge' && 'Information retrieval and analysis workflows'}
                {process.executionModel === 'bpmn' && 'Complex business processes with decision points'}
                {process.executionModel === 'training' && 'Educational modules with assessment and certification'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Agent Information */}
        {process.aiAgentAttached && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
            <h2 className="text-base font-medium text-gray-900 mb-2">AI Assistant</h2>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">AI Agent Available</p>
                <p className="text-blue-700">{process.aiAgentRole}</p>
                <p className="text-sm text-blue-600 mt-2">
                  This process has an AI assistant that can help guide you through the workflow, 
                  provide suggestions, and automate routine tasks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Process Stage Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-base font-medium text-gray-900 mb-2">Current Stage</h2>
          <div className="space-y-3">
            <div className={cn(
              "p-4 rounded-lg",
              stageColors[process.currentStage as keyof typeof stageColors].replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[0] + ' border'
            )}>
              <p className="font-medium text-gray-900 mb-1">{stageLabels[process.currentStage as keyof typeof stageLabels]}</p>
              <p className="text-sm text-gray-600">
                {process.currentStage === 'manual' && 'This process is executed manually by team members.'}
                {process.currentStage === 'assisted' && 'AI provides guidance and suggestions during execution.'}
                {process.currentStage === 'supervised' && 'AI handles most tasks with human oversight.'}
                {process.currentStage === 'automated' && 'Process runs automatically with minimal human intervention.'}
                {process.currentStage === 'ai_promoted' && 'AI agent has been promoted to handle complex scenarios independently.'}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements or Prerequisites */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-base font-medium text-gray-900 mb-2">Requirements</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Access to the {currentDomain?.name || 'domain'} workspace</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Required permissions for {executionModelLabels[process.executionModel as keyof typeof executionModelLabels].toLowerCase()}</span>
            </li>
            {process.aiAgentAttached && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>AI assistant integration enabled</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <button
          onClick={handleStartProcess}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          Start Process
        </button>
      </div>

      {/* Chat Interface */}
      {activeChat && (
        <ChatInterfaceV2
          masterTaskName={activeChat.processName}
          masterTaskId={activeChat.masterTaskId}
          executionModel={activeChat.executionModel}
          onClose={() => setActiveChat(null)}
          accessToken={accessToken || undefined}
          chatId={activeChat.chatId}
        />
      )}
    </div>
  );
}