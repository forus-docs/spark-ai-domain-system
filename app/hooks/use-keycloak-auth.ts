'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useKeycloakAuth() {
  const { data: session, status } = useSession();
  const [isKeycloakEnabled, setIsKeycloakEnabled] = useState(false);

  useEffect(() => {
    // Check if Keycloak is enabled
    setIsKeycloakEnabled(process.env.NEXT_PUBLIC_USE_KEYCLOAK === 'true');
  }, []);

  const keycloakSignIn = async () => {
    if (!isKeycloakEnabled) {
      console.warn('Keycloak is not enabled');
      return;
    }
    await signIn('keycloak');
  };

  const keycloakSignOut = async () => {
    if (!isKeycloakEnabled) {
      console.warn('Keycloak is not enabled');
      return;
    }
    await signOut();
  };

  const getAccessToken = () => {
    if (!isKeycloakEnabled || !session) {
      return null;
    }
    return session.accessToken;
  };

  const getCamundaAuthHeader = () => {
    if (!isKeycloakEnabled || !session?.accessToken) {
      // Fallback to Basic Auth if Keycloak is not enabled
      return null;
    }
    return `Bearer ${session.accessToken}`;
  };

  return {
    session,
    status,
    isKeycloakEnabled,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    keycloakSignIn,
    keycloakSignOut,
    getAccessToken,
    getCamundaAuthHeader,
  };
}