'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { DomainJoinModal } from '@/app/components/domain-join-modal';
import TaskExecutions from '@/app/components/task-executions';

export default function DomainHomePage() {
  const params = useParams();
  const router = useRouter();
  const domainSlug = params.domain as string;
  const { user } = useAuth();
  const { domains, setCurrentDomain, getUserRole, isLoading: domainsLoading } = useDomain();

  // Get domain and check if user has role
  const domain = domains.find(d => d.slug === domainSlug);
  const hasRole = domain ? getUserRole(domain.id) : false;

  useEffect(() => {
    if (!user || domainsLoading || !domain) return;
    
    // User has both domain and role - stay in domain context
    if (hasRole) {
      setCurrentDomain(domain);
      // Already in the domain route, no need to redirect
    }
    // Otherwise stay here to show join modal
  }, [user, domainsLoading, domain, hasRole, router, setCurrentDomain]);

  // Loading state
  if (!user || domainsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Domain not found
  if (!domain) {
    router.replace('/domains');
    return null;
  }

  // User has role - show home content
  if (hasRole) {
    return <TaskExecutions />;
  }

  // Show join modal
  return (
    <DomainJoinModal
      domain={domain}
      isOpen={true}
      onClose={() => {
        // After joining, the user will have a role and this component will re-render
        // Only navigate away if they still don't have a role (e.g., they cancelled)
        if (!getUserRole(domain.id)) {
          router.push('/domains');
        }
      }}
    />
  );
}