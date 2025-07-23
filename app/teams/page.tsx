'use client';

import { EmptyState } from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default function TeamsPage() {
  return (
    <div className="p-8">
      <EmptyState 
        title="Teams"
        description="Create and manage teams within your domain. Collaborate with team members and track team performance."
      />
    </div>
  );
}