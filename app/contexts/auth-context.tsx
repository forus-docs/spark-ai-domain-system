'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    verificationType?: 'kyc' | 'email' | 'phone' | 'document';
    verificationLevel?: 'basic' | 'standard' | 'enhanced';
  };
  isVerified?: boolean; // Deprecated - for backward compatibility
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  setUserVerified: (verified: boolean) => void;
  updateUser: (updatedUser: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Debug function - accessible from console via window.debugUser()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugUser = () => {
        console.log('=== 🔍 USER STATE DEBUG ===');
        console.log('User:', user);
        console.log('Access Token:', accessToken ? 'exists' : 'missing');
        console.log('Loading:', isLoading);
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
        console.log('--- Storage ---');
        console.log('LocalStorage User:', localStorage.getItem('user'));
        console.log('LocalStorage Token:', localStorage.getItem('accessToken'));
        console.log('Cookies:', document.cookie);
        console.log('======================');
        return user;
      };
    }
  }, [user, accessToken, isLoading, error]);

  const clearError = () => {
    setError(null);
  };

  // Check for existing session on mount
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        // Try to refresh the session using the refresh token cookie
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Important: include cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if we actually got user data
          if (data.user && data.accessToken) {
            setAccessToken(data.accessToken);
            
            // Ensure user has id field
            const user = data.user;
            if (!user.id && user._id) {
              user.id = user._id;
            }
            
            setUser(user);
            
            // Store in localStorage for client-side access
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('user', JSON.stringify(user));
            }
          } else {
            // No valid session, clear any stale localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user');
            }
          }
        } else {
          // No valid session, clear any stale localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
        // Clear any stale localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      } finally {
        // Always set loading to false
        setIsLoading(false);
      }
    };
    
    // Set loading to false immediately if we're on the client
    if (typeof window !== 'undefined') {
      loadUserSession();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAccessToken(data.accessToken);
      
      // Fetch user domains
      const domainsResponse = await fetch('/api/user/domains', {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`,
        },
      });
      
      let fullUser = data.user;
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        fullUser = {
          ...data.user,
          domains: domainsData.domains || [],
          currentDomainId: domainsData.currentDomainId
        };
      } else {
        // Ensure user has domains structure even if fetch failed
        fullUser = {
          ...data.user,
          domains: [],
          currentDomainId: null
        };
      }
      
      setUser(fullUser);
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }

      // Small delay to ensure state is propagated before redirect
      // This helps avoid the double refresh issue
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      // Don't throw - let the component handle the error display
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setAccessToken(result.accessToken);
      
      // Fetch user domains (new users won't have any, but we need the structure)
      const domainsResponse = await fetch('/api/user/domains', {
        headers: {
          'Authorization': `Bearer ${result.accessToken}`,
        },
      });
      
      let fullUser = result.user;
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        fullUser = {
          ...result.user,
          domains: domainsData.domains || [],
          currentDomainId: domainsData.currentDomainId || null
        };
      } else {
        // Ensure user has domains structure even if fetch failed
        fullUser = {
          ...result.user,
          domains: [],
          currentDomainId: null
        };
      }
      
      setUser(fullUser);
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }

      // Small delay to ensure state is propagated before redirect
      // This helps avoid the double refresh issue
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      // Don't throw - let the component handle the error display
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear client-side state
    setUser(null);
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    
    // Redirect to unified auth page
    router.push('/auth');
  };

  const setUserVerified = (verified: boolean) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        identity: {
          ...user.identity,
          isVerified: verified,
          verifiedAt: verified ? new Date() : undefined
        }
      };
      console.log('setUserVerified called:', {
        verified,
        oldIdentity: user.identity,
        newIdentity: updatedUser.identity
      });
      setUser(updatedUser);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('User verification updated in localStorage');
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        register,
        logout,
        isLoading,
        error,
        clearError,
        setUserVerified,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}