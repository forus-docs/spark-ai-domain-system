'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CamundaUser {
  username: string;
  password: string;
  displayName: string;
}

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'failed';

interface CamundaContextType {
  currentUser: CamundaUser | null;
  setCurrentUser: (user: CamundaUser) => void;
  getAuthHeader: () => string;
  availableUsers: CamundaUser[];
  authStatus: AuthStatus;
  verifyAuth: () => Promise<void>;
}

// Hardcoded Camunda demo users
const CAMUNDA_USERS: CamundaUser[] = [
  { username: 'demo', password: 'demo', displayName: 'Demo User' },
  { username: 'john', password: 'john', displayName: 'John Doe' },
  { username: 'mary', password: 'mary', displayName: 'Mary Anne' },
  { username: 'peter', password: 'peter', displayName: 'Peter Meter' },
];

export const CamundaContext = createContext<CamundaContextType | undefined>(undefined);

export function CamundaProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CamundaUser | null>(CAMUNDA_USERS[0]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');

  const getAuthHeader = () => {
    if (!currentUser) return '';
    // Basic auth header for Camunda REST API
    const credentials = btoa(`${currentUser.username}:${currentUser.password}`);
    return `Basic ${credentials}`;
  };

  const verifyAuth = async () => {
    if (!currentUser) {
      setAuthStatus('idle');
      return;
    }

    setAuthStatus('checking');
    
    try {
      const response = await fetch('/api/camunda/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Camunda-Auth': btoa(`${currentUser.username}:${currentUser.password}`),
        },
      });

      if (response.ok) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('failed');
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      setAuthStatus('failed');
    }
  };

  // Verify auth when user changes
  useEffect(() => {
    if (currentUser) {
      verifyAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <CamundaContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        getAuthHeader,
        availableUsers: CAMUNDA_USERS,
        authStatus,
        verifyAuth,
      }}
    >
      {children}
    </CamundaContext.Provider>
  );
}

export function useCamunda() {
  const context = useContext(CamundaContext);
  if (context === undefined) {
    throw new Error('useCamunda must be used within a CamundaProvider');
  }
  return context;
}