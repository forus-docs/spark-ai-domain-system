'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';

export default function TasksRedirectPage() {
  const router = useRouter();
  const { currentDomain } = useDomain();

  useEffect(() => {
    // If we have a current domain, redirect to the domain-specific tasks page
    if (currentDomain?.slug) {
      router.push(`/${currentDomain.slug}/tasks`);
    } else {
      // If no domain selected, redirect to domains page
      router.push('/domains');
    }
  }, [currentDomain, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to tasks...</p>
      </div>
    </div>
  );
}