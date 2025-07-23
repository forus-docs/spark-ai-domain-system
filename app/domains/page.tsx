'use client';

export const dynamic = 'force-dynamic';

import { useDomain } from '@/app/contexts/domain-context';
import { DomainGrid } from '@/app/components/domain-grid';

export default function DomainsPage() {
  const { isLoading: isDomainLoading } = useDomain();


  // Show loading state while checking domain status
  if (isDomainLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-4">
        <h1 className="text-xl font-light text-gray-900">Network Domains</h1>
        <p className="text-xs text-gray-600 mt-1">Join existing networks or create your own domain to unite your industry</p>
      </div>

      <DomainGrid />
    </div>
  );
}