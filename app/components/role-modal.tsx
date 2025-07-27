'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { RoleCard } from '@/app/components/role-card';
import { CreateInviteLinkModal } from '@/app/components/create-invite-link-modal';
import type { Role } from '@/app/types/domain.types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  domainName?: string;
}

export function RoleModal({ isOpen, onClose, role, domainName }: RoleModalProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (!isOpen || !role) return null;

  const handleProceed = () => {
    setShowInviteModal(true);
  };

  const handleInviteModalClose = () => {
    setShowInviteModal(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
        <div className={cn(
          "bg-white rounded-t-2xl md:rounded-lg shadow-xl",
          "w-full md:max-w-lg",
          "max-h-[90vh] md:max-h-[80vh]",
          "flex flex-col"
        )}>
          {/* Header - Same height as app bar */}
          <div className="h-14 border-b border-gray-200 flex items-center px-3">
            <div className="flex items-center justify-between w-full">
              {/* Close button - Aligned with hamburger */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Title */}
              <div className="flex-1 flex items-center px-3">
                <h2 className="text-base font-semibold text-gray-900">{role.name}</h2>
              </div>

              {/* Empty space for balance */}
              <div className="w-11"></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <RoleCard
              role={role}
              isSelected={false}
              onClick={() => {}}
              showPrice={false}
            />
          </div>

          {/* Footer with Proceed Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleProceed}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

      {/* Create Invite Link Modal */}
      <CreateInviteLinkModal
        isOpen={showInviteModal}
        onClose={handleInviteModalClose}
        role={role}
        domainName={domainName}
      />
    </>
  );
}