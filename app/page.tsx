'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { currentDomain, isLoading: isDomainLoading } = useDomain();
  const { user } = useAuth();

  useEffect(() => {
    // Simple redirect logic - root page is not meant to be viewed
    if (!user) {
      // Not authenticated - middleware should handle this
      return;
    }
    
    if (!isDomainLoading) {
      if (currentDomain?.slug) {
        // User has a current domain - go there
        router.replace(`/${currentDomain.slug}`);
      } else {
        // No current domain - go to domains page
        router.replace('/domains');
      }
    }
  }, [user, currentDomain, isDomainLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}