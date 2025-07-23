'use client';

import { EmptyState } from '@/app/components/empty-state';

export const dynamic = 'force-dynamic';

export default function DashboardsPage() {
  return (
    <div className="p-8">
      <EmptyState 
        title="Dashboards"
        description="Access real-time analytics and insights for your domain. Monitor key performance indicators and make data-driven decisions."
      />
    </div>
  );
}