'use client';

import { EmptyState } from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default function OrganogramPage() {
  return (
    <div className="p-8">
      <EmptyState 
        title="Organogram"
        description="Visualize your organization's structure and hierarchy within the domain. View reporting lines and team relationships."
      />
    </div>
  );
}