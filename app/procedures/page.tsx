'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { ProcessCard } from '@/app/components/process-card';
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

export default function ProceduresPage() {
  const router = useRouter();
  const { currentDomain } = useDomain();

  const processes = currentDomain ? processMap[currentDomain.id] || [] : [];

  const handleProcessClick = (process: any) => {
    // Navigate to process detail page
    router.push(`/domains/${currentDomain?.id}/processes/${process.id}`);
  };

  return (
    <div className="p-3">
      <div className="mb-3">
        <h2 className="text-lg font-light text-gray-900">Domain Processes</h2>
        <p className="text-xs text-gray-600">
          {currentDomain 
            ? `Execute and manage processes for ${currentDomain.name}`
            : 'Select a domain to view available processes'
          }
        </p>
      </div>

      {!currentDomain ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No domain selected</p>
          <button
            onClick={() => router.push('/domains')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Browse Domains
          </button>
        </div>
      ) : processes.length > 0 ? (
        <div className="grid gap-2 grid-cols-1">
          {processes.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onClick={() => handleProcessClick(process)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No processes available for this domain.
        </div>
      )}
    </div>
  );
}