'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';

export default function DomainTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const domainSlug = params.domain as string;
  const masterTaskId = params.masterTaskId as string;
  const { domains, setCurrentDomain, currentDomain } = useDomain();

  useEffect(() => {
    // Ensure the domain is set based on the URL
    const domain = domains.find(d => d.slug === domainSlug);
    if (domain) {
      setCurrentDomain(domain);
    }
  }, [domainSlug, domains, setCurrentDomain]);

  // Redirect to the main task detail page
  useEffect(() => {
    if (currentDomain) {
      router.push(`/domains/${currentDomain.id}/tasks/${masterTaskId}${window.location.search}`);
    }
  }, [router, currentDomain, masterTaskId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Redirecting to task details...</div>
    </div>
  );
}