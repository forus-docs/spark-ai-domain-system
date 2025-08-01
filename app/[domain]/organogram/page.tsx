'use client';

import { EmptyState } from '@/app/components/empty-state';
import { useDomain } from '@/app/contexts/domain-context';

export default function DomainOrganogramPage() {
  const { currentDomain } = useDomain();

  return (
    <div className="p-8">
      <EmptyState 
        title="Domain Organogram"
        description={`Visualize the organizational structure and hierarchy within ${currentDomain?.name || 'this domain'}. View reporting lines, team relationships, and role distributions. Track how members are organized across different departments and functions.`}
      />
    </div>
  );
}