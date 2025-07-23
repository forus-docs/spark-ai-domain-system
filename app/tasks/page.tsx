'use client';

import { EmptyState } from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default function TasksPage() {
  return (
    <div className="p-8">
      <EmptyState 
        title="Tasks"
        description="Track and manage tasks across your domain. Assign responsibilities and monitor progress in real-time."
      />
    </div>
  );
}