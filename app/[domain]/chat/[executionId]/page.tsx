'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';

export default function DomainChatPage() {
  const params = useParams();
  const router = useRouter();
  const domainSlug = params.domain as string;
  const executionId = params.executionId as string;
  const { domains, setCurrentDomain } = useDomain();

  useEffect(() => {
    // Ensure the domain is set based on the URL
    const domain = domains.find(d => d.slug === domainSlug);
    if (domain) {
      setCurrentDomain(domain);
    }
  }, [domainSlug, domains, setCurrentDomain]);

  // Redirect to the main chat page
  useEffect(() => {
    router.push(`/chat/${executionId}`);
  }, [router, executionId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Redirecting to chat...</div>
    </div>
  );
}