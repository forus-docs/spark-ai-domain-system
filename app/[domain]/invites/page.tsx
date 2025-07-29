'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { RoleModal } from '@/app/components/role-modal';
import { Crown, Users, Briefcase, Store, TrendingUp, UserCheck, Search, UserPlus } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { Role } from '@/app/types/domain.types';

// Map role IDs to icons (matching left-drawer.tsx)
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

export default function InvitesPage() {
  const params = useParams();
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

  if (!currentDomain) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No domain selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invite Members</h1>
          <p className="mt-2 text-sm text-gray-600">
            Select a role below to generate an invite link for new members
          </p>
        </div>

        {/* Roles Grid */}
        {currentDomain.roles && currentDomain.roles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDomain.roles.map((role) => {
              const Icon = roleIcons[role.id] || UserPlus;
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleClick(role)}
                  className={cn(
                    "relative group bg-white rounded-lg shadow-sm hover:shadow-md",
                    "border border-gray-200 hover:border-gray-300",
                    "p-6 text-left transition-all duration-200",
                    "hover:scale-[1.02]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg",
                      "bg-gradient-to-br from-blue-50 to-blue-100",
                      "group-hover:from-blue-100 group-hover:to-blue-200",
                      "transition-colors duration-200"
                    )}>
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {role.name}
                      </h3>
                      {role.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className={cn(
                    "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r",
                    "from-blue-500 to-blue-600",
                    "transform scale-x-0 group-hover:scale-x-100",
                    "transition-transform duration-200 origin-left"
                  )} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles available</h3>
            <p className="mt-1 text-sm text-gray-500">
              This domain hasn&apos;t configured any roles for invitations.
            </p>
          </div>
        )}
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        role={selectedRole}
        domainName={currentDomain?.name}
      />
    </div>
  );
}