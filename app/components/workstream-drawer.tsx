'use client';

import { useRouter } from 'next/navigation';
import { X, Users } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useDomain } from '@/app/contexts/domain-context';

interface WorkstreamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkstreamDrawer({ isOpen, onClose }: WorkstreamDrawerProps) {
  const router = useRouter();
  const { currentDomain } = useDomain();

  const handleWorkstreamClick = () => {
    if (currentDomain) {
      router.push(`/${currentDomain.slug}/new-workstream`);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50",
          "w-64",
          "bg-white shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentDomain ? (
            <button
              onClick={handleWorkstreamClick}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Workstream</span>
            </button>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">
                Select a domain to access workstream
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}