'use client';

import { cn } from '@/app/lib/utils';
import { Users } from 'lucide-react';
import type { Domain } from '@/app/types/domain.types';

interface DomainInfoCardProps {
  domain: Domain;
  className?: string;
}

export function DomainInfoCard({ domain, className }: DomainInfoCardProps) {
  return (
    <div className={cn(
      "rounded-lg border-2 border-gray-200 bg-white overflow-hidden",
      className
    )}>
      {/* Gradient Header */}
      <div className={cn(
        "h-20 bg-gradient-to-br",
        domain.gradient,
        "flex items-center justify-center"
      )}>
        <span className="text-4xl">{domain.icon}</span>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {domain.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {domain.tagline}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{domain.memberCount} members</span>
          </div>
          <span>•</span>
          <span>{domain.region}</span>
        </div>
      </div>
    </div>
  );
}