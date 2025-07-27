'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { DomainJoinModal } from '@/app/components/domain-join-modal';

export default function DomainHomePage() {
  const params = useParams();
  const router = useRouter();
  const domainSlug = params.domain as string;
  const { user } = useAuth();
  const { domains, currentDomain, setCurrentDomain, getUserRole, isLoading: domainsLoading } = useDomain();
  
  console.log(`[DomainPage ${domainSlug}] Render:`, {
    hasUser: !!user,
    domainsLoading,
    domainsCount: domains.length,
    currentDomain: currentDomain?.slug
  });

  // Get current domain
  const domain = domains.find(d => d.slug === domainSlug);
  const userRole = domain ? getUserRole(domain.id) : null;

  useEffect(() => {
    const startTime = Date.now();
    console.log(`[DomainPage ${domainSlug}] useEffect start`);
    
    // For logged-in users with domains, redirect to home immediately
    // The home page will handle domain selection and filtering
    if (user && user.domains && user.domains.length > 0) {
      console.log(`[DomainPage ${domainSlug}] User has domains, checking roles...`);
      // Check if user has any role (not null) in any domain
      const hasAnyRole = user.domains.some((d: any) => d.role !== null);
      if (hasAnyRole) {
        console.log(`[DomainPage ${domainSlug}] User has role, redirecting to / (took ${Date.now() - startTime}ms)`);
        router.replace('/');
        return;
      }
    }
    
    // Wait for domains to load for other checks
    if (domainsLoading || !user) {
      console.log(`[DomainPage ${domainSlug}] Waiting for domains/user (domainsLoading: ${domainsLoading}, hasUser: ${!!user})`);
      return;
    }
    
    // Find the domain by slug
    if (!domain) {
      console.log(`[DomainPage ${domainSlug}] Domain not found, redirecting to /`);
      router.replace('/');
      return;
    }

    // Set as current domain (only if not already set)
    if (currentDomain?.id !== domain.id) {
      console.log(`[DomainPage ${domainSlug}] Setting current domain (took ${Date.now() - startTime}ms so far)`);
      setCurrentDomain(domain);
    } else {
      console.log(`[DomainPage ${domainSlug}] Current domain already set correctly, skipping update`);
    }
    
    // Check user's role in this specific domain
    if (userRole) {
      // Has role in this domain - redirect
      console.log(`[DomainPage ${domainSlug}] User has role in domain, redirecting to / (total time: ${Date.now() - startTime}ms)`);
      router.replace('/');
    }
    // If no role, modal will show via the component below
  }, [user, domainSlug, domains, domainsLoading, setCurrentDomain, getUserRole, router, domain, userRole]);

  // Show loading while checking
  if (!user || domainsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If user has role, they'll be redirected by useEffect
  // If not, show the join modal
  return (
    <>
      {domain && !userRole && (
        <DomainJoinModal
          domain={domain}
          isOpen={true}
          onClose={() => router.push('/')}
        />
      )}
    </>
  );
}