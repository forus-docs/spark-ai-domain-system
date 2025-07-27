'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';
import { getDomainById } from '@/app/lib/mock-data';
import { ProcessCard } from '@/app/components/process-card';
import { EmptyState } from '@/app/components/empty-state';
import { Workflow, ArrowLeft } from 'lucide-react';

// Import mock process data
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

export default function DomainProcessesPage() {
  const params = useParams();
  const router = useRouter();
  const domainId = params.domainId as string;
  const { currentDomain, setCurrentDomain } = useDomain();
  
  // Set current domain if not already set
  useEffect(() => {
    if (!currentDomain || currentDomain.id !== domainId) {
      const domain = getDomainById(domainId);
      if (domain) {
        setCurrentDomain(domain);
      }
    }
  }, [domainId, currentDomain, setCurrentDomain]);
  
  const processes = processMap[domainId] || [];
  const domainName = currentDomain?.name || getDomainById(domainId)?.name || 'Domain';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/domains')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Domains
        </button>
        
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          {domainName} Processes
        </h1>
        <p className="text-gray-600">
          Sprint 2: Process Execution System - Execute workflows with optional AI assistance
        </p>
      </div>

      {/* Sprint 2 Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Sprint 2 Preview</h3>
        <p className="text-blue-800 mb-4">
          These process cards demonstrate the Process Execution System coming in Sprint 2:
        </p>
        <ul className="space-y-2 text-blue-700 text-sm">
          <li>• Each process can evolve from Manual → Assisted → Supervised → Automated</li>
          <li>• AI agents are optional tools that learn and suggest improvements</li>
          <li>• Processes use one of 5 execution models (Form, SOP, Knowledge, BPMN, Training)</li>
          <li>• Click any process card to see execution details (coming in Sprint 2)</li>
        </ul>
      </div>

      {/* Process Cards Grid */}
      {processes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onClick={() => {
                // Sprint 2: Would navigate to process execution
                alert('Sprint 2: Process execution interface coming soon!');
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No Processes Available"
          description="This domain doesn't have any processes configured yet."
          icon={Workflow}
        />
      )}
    </div>
  );
}