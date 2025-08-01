'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface KeycloakProviderProps {
  children: ReactNode;
}

export function KeycloakProvider({ children }: KeycloakProviderProps) {
  // Only use Keycloak if enabled
  const useKeycloak = process.env.NEXT_PUBLIC_USE_KEYCLOAK === 'true';

  if (!useKeycloak) {
    return <>{children}</>;
  }

  return (
    <SessionProvider refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}