'use client';

import { X, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useState, useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import type { Role } from '@/app/types/domain.types';

interface CreateInviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  domainName?: string;
}

export function CreateInviteLinkModal({ isOpen, onClose, role, domainName }: CreateInviteLinkModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentDomain } = useDomain();
  const { accessToken } = useAuth();

  // Generate invite when modal opens
  useEffect(() => {
    if (isOpen && currentDomain && role && accessToken) {
      generateInvite();
    }
  }, [isOpen]);

  const generateInvite = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          domainId: currentDomain?.id,
          roleId: role?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate invite');
      }

      const data = await response.json();
      const inviteUrl = `${window.location.origin}/invite/${data.invite.code}`;
      setInviteLink(inviteUrl);
    } catch (err) {
      console.error('Error generating invite:', err);
      setError('Failed to generate invite link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

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
                <h2 className="text-base font-semibold text-gray-900">Create Invite Link</h2>
              </div>

              {/* Empty space for balance */}
              <div className="w-11"></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Generate an invite link for the <span className="font-medium">{role?.name || 'Unknown'}</span> role
                  {domainName && (
                    <>
                      {' '}in <span className="font-medium">{domainName}</span>
                    </>
                  )}.
                </p>
              </div>

              {/* Link Display */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">Generating invite link...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={generateInvite}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-700"
                  >
                    Try again
                  </button>
                </div>
              ) : inviteLink ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Invite Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        isCopied
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      )}
                      aria-label="Copy link"
                    >
                      {isCopied ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This link expires in 7 days
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                disabled={!inviteLink || isLoading}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg transition-colors",
                  inviteLink && !isLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {isCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}