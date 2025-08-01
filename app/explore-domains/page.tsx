'use client';

export const dynamic = 'force-dynamic';

import { DomainGrid } from '@/app/components/domain-grid';

export default function ExploreDomainsPage() {
  return (
    <div className="p-3">
      <div className="mb-4">
        <h1 className="text-xl font-light text-gray-900">Explore Network Domains</h1>
        <p className="text-xs text-gray-600 mt-1">
          Join existing networks or create your own domain to unite your industry
        </p>
      </div>

      <DomainGrid />
    </div>
  );
}