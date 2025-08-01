'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';

export default function DomainsRedirectPage() {
  const router = useRouter();
  const { currentDomain, isLoading } = useDomain();

  useEffect(() => {
    // This page exists only for backward compatibility
    // Redirect to the appropriate page based on context
    if (!isLoading) {
      if (currentDomain?.slug) {
        // User has a current domain - go there
        router.replace(`/${currentDomain.slug}`);
      } else {
        // No current domain - go to explore domains
        router.replace('/explore-domains');
      }
    }
  }, [currentDomain, isLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}