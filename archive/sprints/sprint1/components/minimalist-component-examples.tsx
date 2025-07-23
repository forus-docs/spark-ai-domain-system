// Minimalist Component Examples
// Clean, elegant implementations with generous whitespace and subtle interactions

import React, { useState, useRef, useEffect } from 'react';
import { Domain, UserDomainMembership, DomainRole } from '@/types/domain.types';

// ============================================
// 1. MINIMALIST DOMAIN CARD
// ============================================

interface MinimalDomainCardProps {
  domain: Domain;
  isJoined: boolean;
  userRole?: string;
  onClick: () => void;
}

export const MinimalDomainCard: React.FC<MinimalDomainCardProps> = ({
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

  return (
    <div
      onClick={onClick}
      className="group relative bg-white p-8 rounded-xl cursor-pointer transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-0.5"
    >
      {/* Very subtle gradient accent */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 rounded-xl`} 
      />
      
      <div className="relative">
        {/* Icon and Title */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-2xl opacity-80">{domain.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
          </div>
          {isJoined && (
            <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {getRoleDisplayName()}
            </span>
          )}
        </div>
        
        {/* Content with generous spacing */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{domain.tagline}</p>
          
          <div className="pt-4 space-y-2">
            <p className="text-sm text-gray-700">{domain.cta}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{domain.region}</span>
              {domain.roles.length > 1 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{domain.roles.length} roles</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 2. MINIMALIST SIDEBAR
// ============================================

interface MinimalSidebarProps {
  isOpen: boolean;
  currentDomain: Domain | null;
  navigationItems: Array<{
    id: string;
    label: string;
    icon: string;
    domainSpecific?: boolean;
  }>;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const MinimalSidebar: React.FC<MinimalSidebarProps> = ({
  isOpen,
  currentDomain,
  navigationItems,
  activeSection,
  onNavigate
}) => {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-500 ease-out overflow-hidden`}>
      <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col">
        <div className="flex-1 p-6 space-y-8">
          {/* Logo/Brand area - generous top spacing */}
          <div className="h-12" />
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map(item => {
              if (item.domainSpecific && !currentDomain) return null;
              
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 text-sm
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="opacity-60">{item.icon}</span>
                  <span>{item.label}</span>
                  {currentDomain && item.domainSpecific && (
                    <span className="ml-auto text-xs opacity-40">
                      {currentDomain.icon}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* User section - minimal style */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">J</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Jacques</p>
              <p className="text-xs text-gray-500">Max plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ============================================
// 3. MINIMALIST ROLE SELECTOR
// ============================================

interface MinimalRoleSelectorProps {
  roles: DomainRole[];
  selectedRole: string | null;
  onRoleSelect: (roleId: string) => void;
  disabled?: boolean;
}

export const MinimalRoleSelector: React.FC<MinimalRoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  disabled = false
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-medium text-gray-900">
        Select your role
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          
          return (
            <label
              key={role.id}
              className={`
                relative block p-6 rounded-lg border cursor-pointer
                transition-all duration-200
                ${isSelected 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-100 hover:border-gray-200 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
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
              
              {/* Selected indicator - minimal dot */}
              {isSelected && !disabled && (
                <div className="absolute top-6 right-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-gray-900">{role.name}</span>
                  <span className="text-sm text-gray-600">{role.price}</span>
                </div>
                
                <ul className="space-y-2">
                  {role.benefits.slice(0, 2).map((benefit, i) => (
                    <li key={i} className="text-xs text-gray-600 leading-relaxed">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// 4. MINIMALIST MODAL
// ============================================

interface MinimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MinimalModal: React.FC<MinimalModalProps> = ({
  isOpen,
  onClose,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl p-12 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - minimal style */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {children}
      </div>
    </div>
  );
};

// ============================================
// 5. MINIMALIST BUTTON STYLES
// ============================================

interface MinimalButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MinimalButton: React.FC<MinimalButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'font-medium transition-all duration-200 rounded-lg';
  
  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================
// 6. MINIMALIST EMPTY STATE
// ============================================

interface MinimalEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const MinimalEmptyState: React.FC<MinimalEmptyStateProps> = ({
  icon = '📄',
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <span className="text-3xl opacity-20 mb-6">{icon}</span>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-8">
          {description}
        </p>
      )}
      {action && (
        <MinimalButton variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </MinimalButton>
      )}
    </div>
  );
};