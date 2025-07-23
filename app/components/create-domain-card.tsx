'use client';

import { Plus, Rocket, Users, TrendingUp, Globe } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CreateDomainCardProps {
  onClick: () => void;
}

export function CreateDomainCard({ onClick }: CreateDomainCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer",
        "bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300",
        "hover:border-gray-400 hover:shadow-md transition-all duration-200",
        "overflow-hidden"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4">
          <Globe className="w-24 h-24 text-gray-900" />
        </div>
        <div className="absolute bottom-4 left-4">
          <Users className="w-20 h-20 text-gray-900" />
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Icon and Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Plus className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-lg">Get Your Own Domain</h3>
            <p className="text-sm text-gray-600">Transform your industry with network power</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Rocket className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Launch Your Network</p>
              <p className="text-xs text-gray-600">Unite your industry around shared success</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Build Community Value</p>
              <p className="text-xs text-gray-600">Every member multiplies network benefits</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Exponential Growth</p>
              <p className="text-xs text-gray-600">Network effects drive collective prosperity</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700 mb-3">
            Perfect for industry associations, cooperatives, professional networks, and community organizations.
          </p>
          <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            Learn How to Create Your Domain
          </button>
        </div>
      </div>
    </div>
  );
}