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
    domainId: string;
    roleId: string;
    inviteCode: string;
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

  useEffect(() => {
    // Load domain and role data
    const loadInviteData = async () => {
      try {
        // In production, this would validate the invite code with the backend
        // For now, we'll use mock data
        const foundDomain = mockDomains.find(d => d.id === params.domainId);
        if (!foundDomain) {
          setError('Invalid invite link - domain not found');
          return;
        }

        const foundRole = foundDomain.roles.find(r => r.id === params.roleId);
        if (!foundRole) {
          setError('Invalid invite link - role not found');
          return;
        }

        setDomain(foundDomain);
        setRole(foundRole);
      } catch (err) {
        setError('Failed to load invite details');
      } finally {
        setIsLoading(false);
      }
    };

    loadInviteData();
  }, [params.domainId, params.roleId]);

  useEffect(() => {
    // If user is not logged in, redirect to auth with return URL
    if (!isLoading && !user) {
      const returnUrl = `/invite/${params.domainId}/${params.roleId}/${params.inviteCode}`;
      router.push(`/auth?mode=register&returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, isLoading, params, router]);

  const handleProceedToPayment = () => {
    if (!domain || !role) return;

    // Set the selected role and domain in context
    if (domain && role) {
      // This would typically be handled in the payment flow
      // For now, we'll simulate joining the domain
      joinDomain(domain, role);
      setCurrentDomain(domain);
      
      // In production, this would go to payment page
      // For demo, we'll go to confirmation
      router.push('/domains?joined=true');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading invite details...</p>
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
    // User is being redirected to registration
    return null;
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