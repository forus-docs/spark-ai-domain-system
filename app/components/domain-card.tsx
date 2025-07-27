'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Check, Users, ArrowRight } from 'lucide-react';
import type { Domain } from '@/app/types/domain.types';

interface DomainCardProps {
  domain: Domain;
  isJoined: boolean;
  onClick: () => void;
}

export function DomainCard({ domain, isJoined, onClick }: DomainCardProps) {
  const router = useRouter();
  
  // Use the gradient directly from the domain object
  const gradient = domain.gradient || 'from-gray-500 to-gray-600';

  const handleClick = () => {
    if (isJoined) {
      // Navigate to domain-specific home
      router.push(`/${domain.slug}`);
    } else {
      // Open join modal
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative cursor-pointer",
        "bg-white rounded-lg border border-gray-200",
        "hover:shadow-md hover:border-gray-300 transition-all duration-200",
        isJoined && "ring-2 ring-green-500 ring-opacity-20"
      )}
    >
      {/* Gradient Banner - similar to posts but with gradient */}
      <div className={cn(
        "h-32 rounded-t-lg bg-gradient-to-br",
        gradient,
        "relative overflow-hidden"
      )}>
        {/* Domain Icon/Logo Area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/20 text-6xl font-bold">
            {domain.name.charAt(0)}
          </div>
        </div>
        
        {/* Joined Badge */}
        {isJoined && (
          <div className="absolute top-3 right-3">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-gray-900">Joined</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Domain Name */}
        <h3 className="font-medium text-gray-900 text-base mb-1">
          {domain.name}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {domain.description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{domain.memberCount.toLocaleString()} members</span>
          </div>
          <span>•</span>
          <span>{domain.availableRoles.length} roles available</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {domain.region}
          </div>
          
          <button className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            isJoined ? "text-gray-600" : "text-blue-600"
          )}>
            <span>{isJoined ? 'Go to Domain' : 'Join Domain'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}