'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Target, Users, ClipboardList, ShieldCheck, AlertTriangle, GitBranch, Loader2, Copy, Check } from 'lucide-react';
import { IStandardOperatingProcedure } from '@/app/models/MasterTask';

interface SopPopupProps {
  executionId: string;
  accessToken?: string;
  onClose: () => void;
}

interface ProcessInfo {
  masterTaskId: string;
  processName: string;
  standardOperatingProcedure?: IStandardOperatingProcedure;
}

export function SopPopup({ executionId, accessToken, onClose }: SopPopupProps) {
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProcessInfo = async () => {
      try {
        // First get taskExecution info to get masterTaskId
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const taskExecutionResponse = await fetch(`/api/task-executions/${executionId}/info`, {
          headers,
        });

        if (!taskExecutionResponse.ok) {
          throw new Error('Failed to fetch taskExecution info');
        }

        const taskExecutionData = await taskExecutionResponse.json();
        
        if (!taskExecutionData.taskExecution?.masterTaskId) {
          setError('No master task associated with this taskExecution');
          return;
        }

        // Then fetch process details
        const processResponse = await fetch(`/api/master-tasks/${taskExecutionData.taskExecution.masterTaskId}`, {
          headers,
        });

        if (!processResponse.ok) {
          throw new Error('Failed to fetch process details');
        }

        const processData = await processResponse.json();
        
        if (!processData.process?.standardOperatingProcedure) {
          setError('No Standard Operating Procedure available for this process');
          return;
        }

        setProcessInfo({
          masterTaskId: processData.process.masterTaskId,
          processName: processData.process.name,
          standardOperatingProcedure: processData.process.standardOperatingProcedure
        });
      } catch (error) {
        console.error('Error fetching SOP:', error);
        setError('Failed to load Standard Operating Procedure');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessInfo();
  }, [executionId, accessToken]);

  const sop = processInfo?.standardOperatingProcedure;

  const handleCopy = async () => {
    if (!sop) return;
    
    try {
      // Create a formatted text version of the SOP
      const sopText = `Standard Operating Procedure: ${processInfo.processName}

OBJECTIVE
${sop.objective}

SCOPE
Included:
${sop.scope.included.map(item => `• ${item}`).join('\n')}

Excluded:
${sop.scope.excluded.map(item => `• ${item}`).join('\n')}

POLICIES & COMPLIANCE
Compliance: ${sop.policies.compliance.join(', ')}
Standards:
${sop.policies.standards.map(item => `• ${item}`).join('\n')}

ROLES & RESPONSIBILITIES
${sop.rolesAndResponsibilities.map(role => `
${role.role}:
${role.responsibilities.map(resp => `• ${resp}`).join('\n')}
${role.requiredSkills ? `Required Skills: ${role.requiredSkills.join(', ')}` : ''}`).join('\n')}

PROCEDURES
${sop.procedures.map(proc => `
Step ${proc.stepNumber}: ${proc.name}
${proc.description}
Responsible: ${proc.responsible}
${proc.duration ? `Duration: ${proc.duration}` : ''}
${proc.inputs ? `Inputs: ${proc.inputs.join(', ')}` : ''}
${proc.outputs ? `Outputs: ${proc.outputs.join(', ')}` : ''}
${proc.decisionPoints ? proc.decisionPoints.map(dp => `
Decision Point:
  If: ${dp.condition}
  Then: ${dp.truePath}
  Else: ${dp.falsePath}`).join('\n') : ''}`).join('\n')}

METADATA
Version: ${sop.metadata.version}
Effective Date: ${new Date(sop.metadata.effectiveDate).toLocaleDateString()}
Review Date: ${new Date(sop.metadata.reviewDate).toLocaleDateString()}
Owner: ${sop.metadata.owner}
Approved By: ${sop.metadata.approvedBy}`;

      await navigator.clipboard.writeText(sopText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Standard Operating Procedure</h2>
              {processInfo && (
                <p className="text-sm text-gray-600">{processInfo.processName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sop && (
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded transition-colors"
                title="Copy SOP"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            ) : sop ? (
              <div className="space-y-6">
                {/* Objective */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Objective</h4>
                  </div>
                  <p className="text-sm text-gray-700 pl-7">{sop.objective}</p>
                </section>

                {/* Scope */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Scope</h4>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Included:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {sop.scope.included.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Excluded:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {sop.scope.excluded.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Policies */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Policies & Compliance</h4>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Compliance:</p>
                      <div className="flex flex-wrap gap-2">
                        {sop.policies.compliance.map((item, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Standards:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {sop.policies.standards.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Roles and Responsibilities */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Roles & Responsibilities</h4>
                  </div>
                  <div className="pl-7 space-y-3">
                    {sop.rolesAndResponsibilities.map((role, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">{role.role}</h5>
                        <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                          {role.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                        {role.requiredSkills && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600">Required Skills:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.requiredSkills.map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Procedures */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Procedures</h4>
                  </div>
                  <div className="pl-7 space-y-3">
                    {sop.procedures.map((procedure, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900">
                            Step {procedure.stepNumber}: {procedure.name}
                          </h5>
                          {procedure.duration && (
                            <span className="text-xs text-gray-500">{procedure.duration}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 mb-2">{procedure.description}</p>
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Responsible:</span> {procedure.responsible}
                        </p>
                        
                        <div className="space-y-2 text-xs">
                          {procedure.inputs && procedure.inputs.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-600 mb-1">Inputs:</p>
                              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                                {procedure.inputs.map((input, idx) => (
                                  <li key={idx}>{input}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {procedure.outputs && procedure.outputs.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-600 mb-1">Outputs:</p>
                              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                                {procedure.outputs.map((output, idx) => (
                                  <li key={idx}>{output}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {procedure.decisionPoints && procedure.decisionPoints.length > 0 && (
                          <div className="mt-3 bg-yellow-50 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3 text-yellow-600" />
                              <p className="text-xs font-medium text-yellow-800">Decision Points:</p>
                            </div>
                            {procedure.decisionPoints.map((decision, idx) => (
                              <div key={idx} className="text-xs text-yellow-700 ml-4">
                                <p><span className="font-medium">If:</span> {decision.condition}</p>
                                <p className="ml-4">→ <span className="text-green-700">{decision.truePath}</span></p>
                                <p className="ml-4">→ <span className="text-red-700">{decision.falsePath}</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Metadata */}
                <section className="border-t pt-4">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Version:</span> {sop.metadata.version}</p>
                    <p><span className="font-medium">Effective Date:</span> {new Date(sop.metadata.effectiveDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Review Date:</span> {new Date(sop.metadata.reviewDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Owner:</span> {sop.metadata.owner}</p>
                    <p><span className="font-medium">Approved By:</span> {sop.metadata.approvedBy}</p>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}