'use client';

import { cn } from '@/app/lib/utils';
import { Check, Crown, Users, Briefcase, Store, TrendingUp, UserCheck, Search } from 'lucide-react';
import type { Role } from '@/app/types/domain.types';

interface RoleCardProps {
  role: Role;
  isSelected: boolean;
  onClick: (role: Role) => void;
  showPrice?: boolean;
}

// Map role IDs to icons (shared with other components)
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

export function RoleCard({ role, isSelected, onClick, showPrice = true }: RoleCardProps) {
  const Icon = roleIcons[role.id] || Users;

  return (
    <button
      onClick={() => onClick(role)}
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all duration-200",
        "text-left hover:shadow-md w-full",
        isSelected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isSelected ? "bg-blue-100" : "bg-gray-100"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isSelected ? "text-blue-600" : "text-gray-600"
          )} />
        </div>
        
        <div className="flex-1">
          <h4 className={cn(
            "text-base font-medium mb-0.5",
            isSelected ? "text-blue-900" : "text-gray-900"
          )}>
            {role.name}
          </h4>
          <p className={cn(
            "text-sm mb-2",
            isSelected ? "text-blue-700" : "text-gray-600"
          )}>
            {role.description}
          </p>

          {/* Benefits */}
          <div className="space-y-0.5">
            {role.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <Check className={cn(
                  "w-3 h-3",
                  isSelected ? "text-blue-600" : "text-gray-400"
                )} />
                <span className={cn(
                  isSelected ? "text-blue-700" : "text-gray-600"
                )}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Price */}
          {showPrice && (
            <div className={cn(
              "mt-2 text-sm font-medium",
              isSelected ? "text-blue-900" : "text-gray-900"
            )}>
              {role.price}
            </div>
          )}
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}