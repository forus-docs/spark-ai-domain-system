'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { AuthLayout, AuthForm, AuthMode, AuthFormData, LoadingState } from '@forus/ui';

interface AuthFormWrapperProps {
  intendedDomain?: string;
}

function AuthFormWrapper({ intendedDomain }: AuthFormWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isLoading, error, user, clearError } = useAuth();
  
  // Get mode from URL params, or check if first-time user
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<AuthMode>('login'); // Default state
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Capture returnUrl early and store it to prevent loss during re-renders
  const [returnUrl] = useState(() => {
    const urlReturn = searchParams.get('returnUrl');
    // Use intended domain from server-side cookie if no URL param
    if (!urlReturn && intendedDomain) {
      return `/${intendedDomain}`;
    }
    return urlReturn;
  });

  // Set initial mode based on URL or first-time user status
  useEffect(() => {
    if (urlMode) {
      setMode(urlMode as AuthMode);
    } else {
      // Default to login mode
      setMode('login');
    }
  }, [urlMode]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('[Auth Page] User authenticated, checking redirect:', {
        returnUrl,
        currentDomainId: user.currentDomainId,
        domains: user.domains?.length
      });
      
      if (returnUrl) {
        // Decode the URL in case it was encoded
        const decodedUrl = decodeURIComponent(returnUrl);
        console.log('[Auth Page] Redirecting to returnUrl:', decodedUrl);
        router.push(decodedUrl);
      } else if (user.domains && user.domains.length > 0 && user.domains.some((d: any) => d.role !== null)) {
        // User has joined at least one domain (has a role) - go to domain-specific home
        console.log('[Auth Page] User has joined domains, redirecting to home');
        // The root page will handle the domain-specific redirect
        router.push('/');
      } else {
        console.log('[Auth Page] User has not joined any domains, redirecting to domains');
        // User hasn't joined any domains yet - go to domains page
        router.push('/domains');
      }
    }
  }, [user, router, returnUrl]);

  // Watch for auth errors and display them
  useEffect(() => {
    if (error) {
      // Handle specific error cases with user-friendly messages
      let errorMessage = 'Authentication failed';
      
      if (error.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        // Automatically switch to login mode for better UX
        setTimeout(() => {
          setMode('login');
          setFormError('');
        }, 2500);
      } else if (error.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.includes('required')) {
        errorMessage = error;
      } else {
        errorMessage = error || 'Authentication failed. Please try again.';
      }
      
      setFormError(errorMessage);
    }
  }, [error]);

  const handleSubmit = async (data: AuthFormData) => {
    setFormError('');
    clearError(); // Clear any previous errors
    setIsSubmitting(true);

    if (mode === 'login') {
      await login(data.email, data.password);
    } else if (mode === 'register') {
      await register(data.email, data.password, data.name || '');
    }
    
    setIsSubmitting(false);
    // Error handling is done via useEffect watching the error state
    // If successful, redirect will happen via useEffect when user is set
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setFormError('');
    clearError(); // Clear any auth context errors
    
    // Update URL without triggering navigation, preserving returnUrl
    const newUrl = returnUrl 
      ? `/auth?mode=${newMode}&returnUrl=${encodeURIComponent(returnUrl)}`
      : `/auth?mode=${newMode}`;
    window.history.replaceState({}, '', newUrl);
  };

  const displayError = formError || error;

  return (
    <AuthLayout
      appName="Spark AI"
      tagline="Transform domains into value-creating networks"
      title={mode === 'login' ? 'Sign in to your account' : 'Create your account'}
      logoSrc="https://mahala.digital/spark/forus-logo.svg"
      footer={
        <p>
          Join the Forus ecosystem where domains become self-organizing value networks.
        </p>
      }
    >
      <AuthForm
        mode={mode}
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        error={displayError}
        loading={isSubmitting || isLoading}
        showOAuth={false} // OAuth will be added later
        showForgotPassword={false} // Not implemented yet
        showRememberMe={false} // Not implemented yet
      />
    </AuthLayout>
  );
}

export default function AuthPageClient({ intendedDomain }: { intendedDomain?: string }) {
  return (
    <Suspense fallback={<LoadingState message="Loading..." fullScreen />}>
      <AuthFormWrapper intendedDomain={intendedDomain} />
    </Suspense>
  );
}