'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Domain, UserDomainMembership, Role } from '@/app/types/domain.types';
import { useAuth } from '@/app/contexts/auth-context';

interface DomainMembership {
  domain: Domain;
  role: Role;
  membership: UserDomainMembership;
}

interface DomainContextType {
  currentDomain: Domain | null;
  currentDomainId: string | null;
  joinedDomains: DomainMembership[];
  domains: Domain[];
  setCurrentDomain: (domain: Domain) => void;
  joinDomain: (domain: Domain, role: Role) => void;
  isJoinedDomain: (domainId: string) => boolean;
  getUserRole: (domainId: string) => string | undefined;
  isLoading: boolean;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, updateUser } = useAuth();
  const [currentDomainId, setCurrentDomainId] = useState<string | null>(null);
  const [membershipData, setMembershipData] = useState<UserDomainMembership[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDomainsLoading, setIsDomainsLoading] = useState(true);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Fetch all domains from API
  useEffect(() => {
    const fetchDomains = async () => {
      setIsDomainsLoading(true);
      try {
        const response = await fetch('/api/domains');
        if (response.ok) {
          const data = await response.json();
          setDomains(data.domains);
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      } finally {
        setIsDomainsLoading(false);
      }
    };
    
    fetchDomains();
  }, []);

  // Load user's domains when auth changes
  useEffect(() => {
    if (user) {
      // Use user's domains from auth
      const memberships: UserDomainMembership[] = user.domains.map(d => ({
        userId: user.id,
        domainId: d.domainId,
        roleId: d.role,
        joinedAt: new Date(d.joinedAt)
      }));
      setMembershipData(memberships);
      
      // Set current domain from database (user.currentDomainId)
      // This ensures persistence across browser sessions
      if (user.currentDomainId && user.domains.some(d => d.domainId === user.currentDomainId)) {
        setCurrentDomainId(user.currentDomainId);
      } else if (user.domains.length > 0) {
        // Fallback to first domain if no current domain set
        setCurrentDomainId(user.domains[0].domainId);
      }
      
      setIsUserLoading(false);
    } else {
      // Clear when logged out
      setMembershipData([]);
      setCurrentDomainId(null);
      setIsUserLoading(false);
    }
  }, [user]);

  // Update main loading state when both user and domains are loaded
  useEffect(() => {
    setIsLoading(isUserLoading || isDomainsLoading);
  }, [isUserLoading, isDomainsLoading]);

  // Remove sessionStorage effect - we're using database persistence now

  // Update current domain in database
  const updateCurrentDomain = async (domainId: string) => {
    if (!accessToken || !user) return;
    
    try {
      const response = await fetch('/api/user/domains', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ currentDomainId: domainId }),
      });
      
      if (response.ok) {
        // Update user in auth context with new currentDomainId
        const updatedUser = { ...user, currentDomainId: domainId };
        if (updateUser) {
          updateUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Failed to update current domain:', error);
    }
  };

  const currentDomain = currentDomainId 
    ? domains.find(d => d.id === currentDomainId) || null
    : null;

  const joinedDomains: DomainMembership[] = membershipData.map(membership => {
    const domain = domains.find(d => d.id === membership.domainId);
    const role = domain?.roles.find(r => r.id === membership.roleId);
    
    return {
      domain: domain!,
      role: role!,
      membership
    };
  }).filter(item => item.domain && item.role);

  const setCurrentDomain = (domain: Domain) => {
    setCurrentDomainId(domain.id);
    updateCurrentDomain(domain.id);
  };

  const joinDomain = async (domain: Domain, role: Role) => {
    if (!user || !accessToken) {
      console.error('Must be logged in to join domain');
      return;
    }

    try {
      const response = await fetch('/api/user/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          domainId: domain.id, 
          roleId: role.id 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state immediately for UI responsiveness
        const newMembership: UserDomainMembership = {
          userId: user.id,
          domainId: domain.id,
          roleId: role.id,
          joinedAt: new Date()
        };
        
        setMembershipData(prev => [...prev, newMembership]);
        setCurrentDomainId(domain.id);
        
        // Update the database with the new current domain
        await updateCurrentDomain(domain.id);
        
        // Update auth context's user object to keep it in sync
        if (user && updateUser) {
          const updatedUser = {
            ...user,
            domains: [...user.domains, {
              domainId: domain.id,
              role: role.id,
              joinedAt: new Date()
            }],
            currentDomainId: domain.id
          };
          
          // Update the user in auth context
          updateUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Failed to join domain:', error);
    }
  };

  const isJoinedDomain = (domainId: string) => {
    return membershipData.some(jd => jd.domainId === domainId);
  };

  const getUserRole = (domainId: string) => {
    return membershipData.find(jd => jd.domainId === domainId)?.roleId;
  };

  return (
    <DomainContext.Provider 
      value={{ 
        currentDomain,
        currentDomainId,
        joinedDomains,
        domains,
        setCurrentDomain,
        joinDomain,
        isJoinedDomain,
        getUserRole,
        isLoading
      }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}