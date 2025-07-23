'use client';

import { EmptyState } from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default function WorkstreamsPage() {
  return (
    <div className="p-8">
      <EmptyState 
        title="Workstreams"
        description="Manage and track your domain-specific workflows and processes. This feature will enable streamlined collaboration across teams."
      />
    </div>
  );
}