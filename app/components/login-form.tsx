'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';

export default function LoginForm() {
  const router = useRouter();
  const { login, error } = useAuth();
  const { currentDomain } = useDomain();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await login();
      // NextAuth will handle the redirect to Keycloak
    } catch (err) {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Welcome to NetBuild</h1>
          <p className="text-gray-600">Sign in with your organization account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
            </svg>
            {isLoading ? 'Redirecting to SSO...' : 'Sign in with SSO'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Secure authentication via Keycloak</span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 mt-6">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}