// Component implementation examples for Phase 1
// These are detailed examples showing how key components should be implemented

// ============================================
// 1. DOMAIN SELECTOR COMPONENT
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Domain, UserDomainMembership } from '@/types/domain.types';
import { useRouter } from 'next/navigation';

interface DomainSelectorProps {
  currentDomain: string | null;
  joinedDomains: UserDomainMembership[];
  domains: Domain[];
  onDomainChange: (domainId: string | null) => void;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  currentDomain,
  joinedDomains,
  domains,
  onDomainChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current domain info
  const currentDomainInfo = currentDomain 
    ? domains.find(d => d.id === currentDomain)
    : null;

  // Get user's role in current domain
  const currentRole = currentDomain
    ? joinedDomains.find(jd => jd.domainId === currentDomain)?.roleId
    : null;

  // Get role display name
  const getRoleDisplayName = (domainId: string, roleId: string) => {
    const domain = domains.find(d => d.id === domainId);
    const role = domain?.roles.find(r => r.id === roleId);
    return role?.name || 'Member';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">🌐</span>
        <div className="flex-1 text-left">
          {currentDomainInfo ? (
            <div>
              <p className="text-sm font-medium text-gray-800">
                {currentDomainInfo.name}
              </p>
              <p className="text-xs text-gray-500">
                {getRoleDisplayName(currentDomain!, currentRole!)} • {currentDomainInfo.region}
              </p>
            </div>
          ) : (
            <span className="text-sm text-gray-600">Join a Domain</span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              router.push('/domains');
              onDomainChange(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-200"
          >
            <span className="text-lg">🌐</span>
            <span className="text-sm">Browse all domains</span>
          </button>

          {joinedDomains.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                Your Domains
              </div>
              {joinedDomains.map(membership => {
                const domain = domains.find(d => d.id === membership.domainId);
                if (!domain) return null;

                return (
                  <button
                    key={domain.id}
                    onClick={() => {
                      onDomainChange(domain.id);
                      router.push('/workstreams');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      currentDomain === domain.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <span className="text-lg">{domain.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{domain.name}</p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(domain.id, membership.roleId)} • {domain.region}
                      </p>
                    </div>
                    {currentDomain === domain.id && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {joinedDomains.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Join domains to access their features
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// 2. ROLE SELECTOR COMPONENT
// ============================================

interface RoleSelectorProps {
  roles: DomainRole[];
  selectedRole: string | null;
  onRoleSelect: (roleId: string) => void;
  disabled?: boolean;
  domainColor: string;
  isJoined?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  disabled = false,
  domainColor,
  isJoined = false
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        {isJoined ? 'Your role:' : 'Select your role:'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          
          return (
            <label
              key={role.id}
              className={`
                relative block p-4 rounded-lg border-2 transition-all cursor-pointer
                ${isSelected 
                  ? 'border-current' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              style={{
                borderColor: isSelected ? domainColor : undefined,
                backgroundColor: isSelected ? `${domainColor}10` : undefined
              }}
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={isSelected}
                onChange={() => onRoleSelect(role.id)}
                disabled={disabled}
                className="sr-only"
              />
              
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{role.name}</span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: domainColor }}
                >
                  {role.price}
                </span>
              </div>
              
              <ul className="text-xs text-gray-600 space-y-1">
                {role.benefits.slice(0, 2).map((benefit, i) => (
                  <li key={i}>• {benefit}</li>
                ))}
              </ul>
              
              {isSelected && !disabled && (
                <div className="absolute top-2 right-2">
                  <span className="text-green-500">✓</span>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {selectedRole && (
        <div className="mt-6 bg-gray-100 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold mb-2">
            {roles.find(r => r.id === selectedRole)?.name} Benefits:
          </h4>
          <ul className="text-sm space-y-1">
            {roles.find(r => r.id === selectedRole)?.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============================================
// 3. DOMAIN CARD COMPONENT
// ============================================

interface DomainCardProps {
  domain: Domain;
  isJoined: boolean;
  userRole?: string;
  onClick: () => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  isJoined,
  userRole,
  onClick
}) => {
  const getRoleDisplayName = () => {
    if (!userRole) return '';
    const role = domain.roles.find(r => r.id === userRole);
    return role?.name || 'Member';
  };

  const hasMultipleRoles = domain.roles.length > 1;

  return (
    <div
      onClick={onClick}
      className="relative bg-white p-6 rounded-lg cursor-pointer hover:shadow-lg transition-all border border-gray-200 overflow-hidden group"
    >
      {/* Gradient background overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} 
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{domain.icon}</span>
            <h3 className="text-lg font-bold">{domain.name}</h3>
          </div>
          {isJoined && (
            <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">
              {getRoleDisplayName()}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{domain.tagline}</p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">{domain.cta}</p>
          <p className="text-xs text-gray-500">Region: {domain.region}</p>
          {hasMultipleRoles && (
            <p className="text-xs text-gray-500">
              {domain.roles.length} roles available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 4. RECENT ITEMS COMPONENT
// ============================================

interface RecentItemsProps {
  items: RecentItem[];
  currentDomain: Domain | null;
  onItemClick: (section: string) => void;
}

export const RecentItems: React.FC<RecentItemsProps> = ({
  items,
  currentDomain,
  onItemClick
}) => {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Recent {currentDomain ? `• ${currentDomain.name}` : ''}
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => onItemClick(item.section)}
            className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 5. EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  section: string;
  currentDomain: Domain | null;
  userRole?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  section,
  currentDomain,
  userRole
}) => {
  if (!currentDomain) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <span className="text-4xl mb-4">🌐</span>
        <p className="text-lg font-medium">Select a domain to view {section}</p>
        <p className="text-sm mt-2">Browse domains to get started</p>
      </div>
    );
  }

  const roleName = currentDomain.roles.find(r => r.id === userRole)?.name || 'Member';

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <span className="text-4xl mb-4">{currentDomain.icon}</span>
      <p className="text-lg font-medium">
        {currentDomain.name} {section} coming soon
      </p>
      <p className="text-sm mt-2">
        You're logged in as {roleName}
      </p>
    </div>
  );
};