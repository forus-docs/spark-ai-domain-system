'use client';

import { useState } from 'react';
import { X, Users, Crown, Briefcase, Store, TrendingUp, UserCheck, Search } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useDomain } from '@/app/contexts/domain-context';
import { RoleModal } from '@/app/components/role-modal';
import type { Role } from '@/app/types/domain.types';

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map role IDs to icons (matching role-selector.tsx)
const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Common roles
  'visitor': Search,
  'existing_member': UserCheck,
  
  // Maven Hub roles
  'maven': Crown,
  'existing_maven': UserCheck,
  'investor_only': TrendingUp,
  
  // Wealth on Wheels roles
  'taxi_owner': Store,
  'taxi_association': Users,
  'driver': Users,
  
  // Bemnet roles
  'saver': TrendingUp,
  'merchant': Store,
  'micro_lender': Briefcase,
  
  // PACCI roles
  'business_member': Briefcase,
  'chamber_member': Users,
  'trade_facilitator': Briefcase,
  
  // Legacy roles (for backward compatibility)
  'retailer': Store,
  'brand': Crown,
  'distributor': Briefcase,
  'shop-owner': Store,
  'manufacturer': Briefcase,
  'procurement-officer': Users,
  'member': Users,
  'investor': TrendingUp,
  'project_owner': Briefcase,
  'advisor': Users,
};

export function LeftDrawer({ isOpen, onClose }: LeftDrawerProps) {
  const { currentDomain } = useDomain();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50",
          "w-64 md:w-72",
          "bg-white shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Invite Member(s)
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Roles Section */}
        <div className="flex-1 overflow-y-auto">
          {currentDomain && currentDomain.roles && currentDomain.roles.length > 0 ? (
            <div>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Roles
                </p>
              </div>
              <nav className="py-1">
                {currentDomain.roles.map((role) => {
                  const Icon = roleIcons[role.id] || Users;
                  
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleClick(role)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3",
                        "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                        "transition-colors duration-200"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium block">{role.name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {currentDomain ? 'No roles available' : 'Select a domain to see available roles'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500 text-center">
            Spark AI Domain System
          </p>
        </div>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        role={selectedRole}
        domainName={currentDomain?.name}
      />
    </>
  );
}