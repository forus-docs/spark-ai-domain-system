'use client';

import { useState, useEffect } from 'react';
import { X, FileText, CheckSquare, Info, Loader2, Workflow, Brain, GitBranch, GraduationCap, Layers } from 'lucide-react';

interface ConversationInfoPopupProps {
  conversationId: string;
  accessToken?: string;
  onClose: () => void;
}

interface ProcessChecklist {
  step: number;
  order: number;
  title: string;
  description: string;
  type: string;
  required: boolean;
  completed: boolean;
  subSteps?: Array<{
    step: number;
    order: number;
    field?: string;
    title: string;
    description: string;
    required: boolean;
  }>;
}

interface ConversationInfo {
  conversation: {
    conversationId: string;
    title: string;
    processId?: string;
    processName?: string;
    executionModel?: string;
    domainId?: string;
    userPostId?: string;
    createdAt: string;
    updatedAt: string;
  };
  userPost?: {
    id: string;
    postId: string;
    userId: string;
    isCompleted: boolean;
    isViewed: boolean;
    isHidden: boolean;
    processId?: string;
    masterPost: {
      title: string;
      description: string;
      postType: string;
      ctaLabel: string;
      domain: string;
    };
  };
  process?: {
    processId: string;
    name: string;
    description: string;
    category: string;
    executionModel: string;
    currentStage: string;
    aiAgentAttached: boolean;
    aiAgentRole?: string;
    checklist?: ProcessChecklist[];
  };
}

// Execution model definitions
const executionModels = {
  form: {
    name: 'Form',
    label: 'Form Based',
    icon: FileText,
    description: 'Structured data collection with validation rules. Forms guide users through a structured process, reducing errors and standardizing data entry.',
    tools: ['Form Builders', 'Validation Engines', 'UI Libraries', 'Data Storage'],
    examples: ['Investor Profile Creation', 'Application Forms', 'Registration Processes']
  },
  sop: {
    name: 'SOP',
    label: 'Standard Operating Procedure',
    icon: Workflow,
    description: 'Step-by-step procedures with compliance tracking. SOPs ensure consistent execution of critical processes by providing detailed instructions and compliance verification.',
    tools: ['Workflow Engines', 'Checklist Tools', 'Compliance Platforms', 'Audit Trail'],
    examples: ['Vehicle Compliance Verification', 'Safety Inspections', 'Quality Control']
  },
  knowledge: {
    name: 'Knowledge',
    label: 'Knowledge Work',
    icon: Brain,
    description: 'Information retrieval and analysis workflows. Handles complex queries that require understanding context, analyzing multiple data sources, and providing intelligent responses.',
    tools: ['LLMs', 'Vector Databases', 'RAG Systems', 'Knowledge Graphs'],
    examples: ['Investment Analysis', 'Credit Score Calculation', 'Market Research']
  },
  bpmn: {
    name: 'BPMN',
    label: 'Business Process',
    icon: GitBranch,
    description: 'Complex business processes with decision points. BPMN handles sophisticated workflows that involve multiple participants, conditional logic, and system integrations.',
    tools: ['BPMN Engines', 'Modeling Tools', 'Process Mining', 'RPA Tools'],
    examples: ['Fleet Route Planning', 'Trade Finance', 'Order Fulfillment']
  },
  training: {
    name: 'Training',
    label: 'Training Module',
    icon: GraduationCap,
    description: 'Educational modules with assessment and certification. Delivers structured learning experiences with progressive content, interactive exercises, and formal assessments.',
    tools: ['LMS Platforms', 'Content Creation', 'Assessment Tools', 'Analytics'],
    examples: ['Driver Safety Training', 'Compliance Training', 'Skills Development']
  }
};

const maturityStages = {
  manual: {
    name: 'Manual',
    color: 'bg-gray-100 text-gray-700',
    description: 'Human executes without AI assistance'
  },
  assisted: {
    name: 'AI Assisted',
    color: 'bg-blue-100 text-blue-700',
    description: 'AI helps but human does the work'
  },
  supervised: {
    name: 'AI Supervised',
    color: 'bg-purple-100 text-purple-700',
    description: 'AI does the work but human supervises'
  },
  automated: {
    name: 'Automated',
    color: 'bg-green-100 text-green-700',
    description: 'AI handles routine cases independently'
  },
  ai_promoted: {
    name: 'AI Promoted',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'AI generates executable artifacts'
  }
};

export function ConversationInfoPopup({ conversationId, accessToken, onClose }: ConversationInfoPopupProps) {
  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversationInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // Fetch conversation info (includes userPost and process details)
        const response = await fetch(`/api/conversations/${conversationId}/info`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to load conversation info: ${response.status}`);
        }

        const data = await response.json();
        setInfo(data);
      } catch (err) {
        console.error('Error fetching conversation info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversationInfo();
  }, [conversationId, accessToken]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Conversation Information</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading information...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              {error}
            </div>
          ) : info ? (
            <div className="space-y-8">
              {/* Conversation Details */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Conversation Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div><span className="font-medium">Title:</span> {info.conversation.title}</div>
                  <div><span className="font-medium">Created:</span> {new Date(info.conversation.createdAt).toLocaleString()}</div>
                  <div><span className="font-medium">Last Updated:</span> {new Date(info.conversation.updatedAt).toLocaleString()}</div>
                  {info.conversation.domainId && (
                    <div><span className="font-medium">Domain:</span> {info.conversation.domainId}</div>
                  )}
                </div>
              </section>

              {/* User Post Details */}
              {info.userPost && (
                <section>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Post Details
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="font-medium text-lg">{info.userPost.masterPost.title}</div>
                      <div className="text-gray-700 mt-1">{info.userPost.masterPost.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {info.userPost.masterPost.postType}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {info.userPost.masterPost.ctaLabel}
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span> {info.userPost.isCompleted ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Viewed:</span> {info.userPost.isViewed ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Process Details */}
              {info.process && (
                <section>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Process Details
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="font-medium text-lg">{info.process.name}</div>
                      <div className="text-gray-700 mt-1">{info.process.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> {info.process.category}
                      </div>
                      <div>
                        <span className="font-medium">Execution Model:</span> {info.process.executionModel}
                      </div>
                      <div>
                        <span className="font-medium">Current Stage:</span> {info.process.currentStage}
                      </div>
                      <div>
                        <span className="font-medium">AI Agent:</span> {info.process.aiAgentAttached ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {info.process.aiAgentRole && (
                      <div className="text-sm">
                        <span className="font-medium">AI Role:</span> {info.process.aiAgentRole}
                      </div>
                    )}
                  </div>

                  {/* Process Checklist */}
                  {info.process.checklist && info.process.checklist.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Process Checklist</h4>
                      <div className="space-y-3">
                        {info.process.checklist.map((item) => (
                          <div key={item.step} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                                {item.step}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                  <span>Type: {item.type}</span>
                                  <span>Required: {item.required ? 'Yes' : 'No'}</span>
                                  <span>Completed: {item.completed ? 'Yes' : 'No'}</span>
                                </div>
                                
                                {/* Sub-steps */}
                                {item.subSteps && item.subSteps.length > 0 && (
                                  <div className="mt-3 ml-8 space-y-2">
                                    {item.subSteps.map((subStep) => (
                                      <div key={subStep.step} className="flex items-start gap-2 text-sm">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gray-50 rounded flex items-center justify-center text-xs">
                                          {subStep.step}
                                        </div>
                                        <div>
                                          <span className="font-medium">{subStep.title}</span>
                                          {subStep.field && (
                                            <span className="text-gray-500 ml-2">({subStep.field})</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Execution Models Analysis */}
              {info.process && (
                <section className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Execution Model Analysis
                  </h3>
                  
                  {/* Current Model Highlight */}
                  {info.process.executionModel && executionModels[info.process.executionModel as keyof typeof executionModels] && (
                    <div className="mb-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {(() => {
                              const model = executionModels[info.process.executionModel as keyof typeof executionModels];
                              const Icon = model.icon;
                              return <Icon className="w-6 h-6 text-yellow-700" />;
                            })()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-yellow-900">
                              Current Model: {executionModels[info.process.executionModel as keyof typeof executionModels].label}
                            </div>
                            <div className="text-sm text-yellow-800 mt-1">
                              {executionModels[info.process.executionModel as keyof typeof executionModels].description}
                            </div>
                            {info.process.currentStage && maturityStages[info.process.currentStage as keyof typeof maturityStages] && (
                              <div className="mt-3">
                                <span className="text-sm font-medium text-yellow-900">Current Stage: </span>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${maturityStages[info.process.currentStage as keyof typeof maturityStages].color}`}>
                                  {maturityStages[info.process.currentStage as keyof typeof maturityStages].name}
                                </span>
                                <div className="text-sm text-yellow-700 mt-1">
                                  {maturityStages[info.process.currentStage as keyof typeof maturityStages].description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Execution Models */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Available Execution Models</h4>
                    <div className="grid gap-4">
                      {Object.entries(executionModels).map(([key, model]) => {
                        const Icon = model.icon;
                        const isCurrentModel = info.process?.executionModel === key;
                        
                        return (
                          <div 
                            key={key} 
                            className={`border rounded-lg p-4 ${
                              isCurrentModel 
                                ? 'border-yellow-300 bg-yellow-50' 
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <Icon className={`w-5 h-5 ${isCurrentModel ? 'text-yellow-700' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className={`font-medium ${isCurrentModel ? 'text-yellow-900' : 'text-gray-900'}`}>
                                    {model.label}
                                  </div>
                                  {isCurrentModel && (
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Current</span>
                                  )}
                                </div>
                                <div className={`text-sm mt-1 ${isCurrentModel ? 'text-yellow-800' : 'text-gray-600'}`}>
                                  {model.description}
                                </div>
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Tools:</span> {model.tools.join(', ')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Examples:</span> {model.examples.join(', ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Maturity Stages */}
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-700">AI Maturity Stages</h4>
                    <div className="space-y-2">
                      {Object.entries(maturityStages).map(([key, stage]) => {
                        const isCurrentStage = info.process?.currentStage === key;
                        
                        return (
                          <div 
                            key={key} 
                            className={`flex items-center gap-3 p-2 rounded ${
                              isCurrentStage ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium min-w-[100px] text-center ${stage.color}`}>
                              {stage.name}
                            </span>
                            <span className={`text-sm ${isCurrentStage ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                              {stage.description}
                            </span>
                            {isCurrentStage && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded ml-auto">Current</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">No information available</div>
          )}
        </div>
      </div>
    </div>
  );
}