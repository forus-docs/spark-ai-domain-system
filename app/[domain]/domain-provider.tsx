'use client';

import { useEffect, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';

interface DomainProviderProps {
  children: React.ReactNode;
  domainSlug: string;
}

export function DomainProvider({ children, domainSlug }: DomainProviderProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { domains, setCurrentDomain, isLoading: domainLoading } = useDomain();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (authLoading || domainLoading) {
      return;
    }

    // If not authenticated, the middleware should have redirected
    // This is a fallback in case middleware didn't catch it
    if (!user) {
      console.log('[DomainProvider] User not authenticated - middleware should have redirected');
      router.push('/auth');
      return;
    }

    // If user has no domains at all, redirect to domains page to join one
    if (!user.domains || user.domains.length === 0) {
      console.log('DomainProvider - User has no domains, redirecting to /domains');
      router.push('/domains');
      return;
    }

    // Find the domain by slug
    const domain = domains.find(d => d.slug === domainSlug);
    
    if (!domain) {
      // Domain doesn't exist
      notFound();
      return;
    }

    // Check if user has access to this domain
    const hasAccess = user.domains?.some((membership: any) => {
      return membership.domainId === domain.id || 
             membership.domain === domain.id || 
             membership.domain?._id === domain.id;
    });

    if (!hasAccess) {
      // User doesn't have access to this domain, redirect to domains page
      router.push('/domains');
      return;
    }

    // Set this as the current domain only if it's different
    if (domain) {
      setCurrentDomain(domain);
    }
    setIsValidating(false);
  }, [authLoading, domainLoading, user, domains, domainSlug, router, setCurrentDomain]);

  if (authLoading || domainLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}