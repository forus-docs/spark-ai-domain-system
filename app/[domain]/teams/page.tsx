'use client';

import { EmptyState } from '@/app/components/empty-state';
import { useDomain } from '@/app/contexts/domain-context';

export default function DomainTeamsPage() {
  const { currentDomain } = useDomain();

  return (
    <div className="p-8">
      <EmptyState 
        title="Domain Teams"
        description={`Create and manage teams within ${currentDomain?.name || 'this domain'}. Organize members into functional teams, assign team leaders, and track team performance. Enable collaboration through team-specific workstreams and shared tasks.`}
      />
    </div>
  );
}