'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function KeycloakSignOutPage() {
  useEffect(() => {
    // Sign out from both NextAuth and Keycloak
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    </div>
  );
}