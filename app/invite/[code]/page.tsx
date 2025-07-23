'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { DomainInfoCard } from '@/app/components/domain-info-card';
import { RoleCard } from '@/app/components/role-card';
import { cn } from '@/app/lib/utils';
import { ArrowRight, Loader2 } from 'lucide-react';
import { mockDomains } from '@/app/lib/mock-data';
import type { Domain, Role } from '@/app/types/domain.types';

interface PageProps {
  params: {
    code: string;
  };
}

export default function InvitePage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { joinDomain, setCurrentDomain } = useDomain();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteValidated, setInviteValidated] = useState(false);
  
  console.log('[InvitePage] Render:', {
    code: params.code,
    user: user?.email,
    isLoading,
    inviteValidated,
    error,
    domain: domain?.name,
    role: role?.name
  });

  useEffect(() => {
    // Validate invite code and load domain/role data
    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invites?code=${params.code}`);
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Invalid invite link');
          return;
        }

        const data = await response.json();
        
        // Load domain and role from mock data (in production, this would come from the API)
        const foundDomain = mockDomains.find(d => d.id === data.invite.domainId);
        if (!foundDomain) {
          setError('Domain not found');
          return;
        }

        const foundRole = foundDomain.roles.find(r => r.id === data.invite.roleId);
        if (!foundRole) {
          setError('Role not found');
          return;
        }

        setDomain(foundDomain);
        setRole(foundRole);
        setInviteValidated(true);
      } catch (err) {
        console.error('Failed to validate invite:', err);
        setError('Failed to validate invite');
      } finally {
        setIsLoading(false);
      }
    };

    validateInvite();
  }, [params.code]);

  useEffect(() => {
    // Only redirect to auth after we've validated the invite
    if (!isLoading && inviteValidated && !user && !error) {
      // Use returnUrl to come back here after auth
      const returnUrl = `/invite/${params.code}`;
      router.push(`/auth?mode=register&returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, isLoading, error, inviteValidated, params.code, router]);

  const handleProceedToPayment = async () => {
    if (!domain || !role) return;

    try {
      // Mark invite as used
      const response = await fetch('/api/invites/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Get token from storage
        },
        body: JSON.stringify({ code: params.code })
      });

      if (!response.ok) {
        throw new Error('Failed to use invite');
      }

      // Join the domain
      joinDomain(domain, role);
      setCurrentDomain(domain);
      
      // In production, this would go to payment page
      // For demo, we'll go to confirmation
      router.push('/domains?joined=true');
    } catch (err) {
      console.error('Failed to process invite:', err);
      setError('Failed to process invite. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating your invite</h2>
            <p className="text-gray-600">Please wait while we verify your invitation...</p>
          </div>
          <div className="text-xs text-gray-500">
            Invite code: {params.code}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 rounded-lg p-6 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => router.push('/domains')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Browse domains instead
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show loading state while redirecting to registration
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to registration</h2>
            <p className="text-gray-600">Please wait while we redirect you to create an account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-light text-gray-900">
            You&apos;ve been invited to join {domain?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Review the domain and role details below to continue
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Domain Card */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Domain</h2>
            {domain && <DomainInfoCard domain={domain} />}
          </div>

          {/* Role Card */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Selected Role</h2>
            {role && (
              <RoleCard
                role={role}
                isSelected={false}
                onClick={() => {}}
                showPrice={true}
              />
            )}
          </div>

          {/* Action Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to join?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Click below to proceed to payment and complete your membership.
            </p>
            
            <button
              onClick={handleProceedToPayment}
              className={cn(
                "w-full md:w-auto px-6 py-3",
                "bg-blue-600 text-white rounded-lg",
                "hover:bg-blue-700 transition-colors",
                "inline-flex items-center justify-center gap-2",
                "font-medium"
              )}
            >
              Proceed to Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}