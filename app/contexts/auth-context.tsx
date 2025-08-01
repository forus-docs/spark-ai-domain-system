'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  currentDomainId?: string;
  domains: Array<{
    domainId: string;
    role: string;
    joinedAt: Date;
  }>;
  identity?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verificationType?: 'kyc' | 'email' | 'phone' | 'document' | 'keycloak';
    verificationLevel?: 'basic' | 'standard' | 'enhanced';
  };
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  setUserVerified: (verified: boolean) => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [additionalUserData, setAdditionalUserData] = useState<Partial<User>>({});

  // Sync NextAuth session with our user state
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          // Fetch full user data from our database
          const response = await fetch('/api/user/profile', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...userData,
              ...additionalUserData, // Merge any updates
            });
          } else {
            // Use basic session data if profile fetch fails
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              username: session.user.username,
              role: 'user',
              domains: [],
              identity: {
                isVerified: true,
                verificationType: 'keycloak',
              },
              ...additionalUserData,
            });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Fallback to session data
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            username: session.user.username,
            role: 'user',
            domains: [],
            identity: {
              isVerified: true,
              verificationType: 'keycloak',
            },
            ...additionalUserData,
          });
        }
      } else {
        setUser(null);
      }
    };

    if (status === 'authenticated') {
      fetchUserData();
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, additionalUserData]);

  // Debug function - accessible from console via window.debugUser()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugUser = () => {
        console.log('=== 🔍 USER STATE DEBUG (Keycloak) ===');
        console.log('NextAuth Status:', status);
        console.log('NextAuth Session:', session);
        console.log('User:', user);
        console.log('Access Token:', session?.accessToken ? 'exists' : 'missing');
        console.log('Loading:', status === 'loading');
        console.log('Error:', error);
        if (user) {
          console.log('--- User Details ---');
          console.log('ID:', user.id);
          console.log('Email:', user.email);
          console.log('Name:', user.name);
          console.log('Current Domain ID:', user.currentDomainId);
          console.log('Domains:', user.domains);
          console.log('Identity:', user.identity);
          console.log('Verified:', user.identity?.isVerified || false);
        }
        console.log('======================');
        return user;
      };
    }
  }, [user, session, status, error]);

  const clearError = () => {
    setError(null);
  };

  const login = async () => {
    try {
      setError(null);
      // Redirect to Keycloak login
      await signIn('keycloak');
    } catch (err) {
      setError('Failed to initiate login');
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      // Clear local state
      setUser(null);
      setAdditionalUserData({});
      // Sign out from NextAuth/Keycloak
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setError('Failed to logout');
      console.error('Logout error:', err);
    }
  };

  const setUserVerified = (verified: boolean) => {
    if (user) {
      const updatedUser = {
        ...user,
        identity: {
          ...user.identity,
          isVerified: verified,
          verifiedAt: verified ? new Date() : undefined,
        },
      };
      setUser(updatedUser);
      setAdditionalUserData(prev => ({
        ...prev,
        identity: updatedUser.identity,
      }));
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Store updates that should persist across session refreshes
    setAdditionalUserData({
      currentDomainId: updatedUser.currentDomainId,
      domains: updatedUser.domains,
      identity: updatedUser.identity,
    });
  };

  const value: AuthContextType = {
    user,
    accessToken: session?.accessToken || null,
    login,
    logout,
    isLoading: status === 'loading',
    error,
    clearError,
    setUserVerified,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}