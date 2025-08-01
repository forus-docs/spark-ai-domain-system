'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import LoginForm from '@/app/components/login-form';

interface AuthFormWrapperProps {
  intendedDomain?: string;
}

function AuthFormWrapper({ intendedDomain }: AuthFormWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Capture returnUrl early and store it to prevent loss during re-renders
  const [returnUrl] = useState(() => {
    const urlReturn = searchParams.get('returnUrl');
    // Use intended domain from server-side cookie if no URL param
    if (!urlReturn && intendedDomain) {
      return `/${intendedDomain}`;
    }
    return urlReturn;
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('[Auth Page] User authenticated, checking redirect:', {
        returnUrl,
        currentDomainId: user.currentDomainId,
        domains: user.domains?.length
      });
      
      // If we have a specific return URL, always use it
      if (returnUrl) {
        // Decode the URL in case it was encoded
        const decodedUrl = decodeURIComponent(returnUrl);
        console.log('[Auth Page] Redirecting to returnUrl:', decodedUrl);
        router.push(decodedUrl);
      } else {
        // No return URL - let the root page handle the redirect logic
        console.log('[Auth Page] No return URL, redirecting to root for domain check');
        router.push('/');
      }
    }
  }, [user, router, returnUrl]);

  return <LoginForm />;
}

export default function AuthPageClient({ intendedDomain }: { intendedDomain?: string }) {
  return <AuthFormWrapper intendedDomain={intendedDomain} />;
}