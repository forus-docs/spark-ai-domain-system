'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { cn } from '@/app/lib/utils';
import { X, Check, ArrowRight, Shield } from 'lucide-react';
import { RoleSelector } from '@/app/components/role-selector';
import type { Domain, Role } from '@/app/types/domain.types';

interface DomainJoinModalProps {
  domain: Domain;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Domain Join Flow - 3 Steps:
 * 
 * Step 1: Role Selection
 * - User selects their desired role in the domain
 * - Each role has an associated membership price
 * 
 * Step 2: Payment
 * - User sees the membership price for their selected role
 * - "Make Payment" button would redirect to payment gateway (not implemented)
 * - "Skip for now" allows bypassing payment for testing/demo
 * 
 * Step 3: Confirmation
 * - Summary of domain and selected role
 * - User completes joining by clicking "Join Domain"
 * 
 * NOTE: Identity verification is NOT part of this flow.
 * It's a separate process handled via posts on the home screen.
 */
type JoinStep = 'role-selection' | 'payment' | 'confirmation';

export function DomainJoinModal({ domain, isOpen, onClose }: DomainJoinModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<JoinStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { joinDomain, isJoinedDomain, setCurrentDomain } = useDomain();

  const isAlreadyJoined = isJoinedDomain(domain.id);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('role-selection');
      setSelectedRole(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (!isAlreadyJoined) {
      setCurrentStep('payment'); // Proceed to membership payment
    }
  };

  const proceedToConfirmation = () => {
    setCurrentStep('confirmation');
  };

  const handleJoinDomain = async () => {
    if (!selectedRole) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!isAlreadyJoined) {
      joinDomain(domain, selectedRole);
    }
    setCurrentDomain(domain);
    
    setIsProcessing(false);
    onClose();
    
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
            {/* Mobile drag handle */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full" />
            
            <h2 className="text-lg font-light text-gray-900">
              {isAlreadyJoined ? `Switch to ${domain.name}` : `Join ${domain.name}`}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Progress Steps - Only show for new joins */}
            {!isAlreadyJoined && (
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-3">
                  {['role-selection', 'payment', 'confirmation'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        currentStep === step || index < ['role-selection', 'payment', 'confirmation'].indexOf(currentStep)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {index + 1}
                      </div>
                      {index < 2 && (
                        <div className={cn(
                          "w-16 h-0.5 mx-2",
                          index < ['role-selection', 'payment', 'confirmation'].indexOf(currentStep)
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 'role-selection' && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">
                  {isAlreadyJoined ? 'Select your role' : 'Choose your role'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {domain.availableRoles.length > 1 
                    ? 'This domain offers multiple roles. Select the one that best fits your needs.'
                    : 'Select your role to continue.'}
                </p>
                <RoleSelector
                  roles={domain.availableRoles}
                  selectedRole={selectedRole}
                  onSelectRole={handleRoleSelect}
                />
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {domain.id === 'maven-hub' && selectedRole?.id === 'maven' ? 'Maven Investment' : 'Identity Verification Payment'}
                </h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  {domain.id === 'maven-hub' ? (
                    selectedRole?.id === 'maven' 
                      ? 'Complete your Maven investment of $1,000 minimum. This includes identity verification.'
                      : 'Complete payment for identity verification to access Maven Hub.'
                  ) : domain.id === 'wealth-on-wheels' ? (
                    selectedRole?.id === 'taxi_association'
                      ? 'Complete association membership payment. This includes identity verification for all association leaders.'
                      : selectedRole?.id === 'taxi_owner'
                      ? 'Complete taxi owner registration payment. This includes identity verification.'
                      : 'Complete payment for identity verification to access Wealth on Wheels.'
                  ) : domain.id === 'bemnet' ? (
                    selectedRole?.id === 'micro_lender'
                      ? 'Complete micro lender registration of $100. This includes identity verification and compliance checks.'
                      : 'Complete payment for identity verification to access Bemnet.'
                  ) : domain.id === 'pacci' ? (
                    selectedRole?.id === 'chamber_member'
                      ? 'Complete chamber membership payment of $500. This includes verification for your organization.'
                      : selectedRole?.id === 'business_member' || selectedRole?.id === 'trade_facilitator'
                      ? `Complete ${selectedRole?.name} registration. This includes business verification.`
                      : 'Complete payment for identity verification to access PACCI.'
                  ) : (
                    `Complete payment to join ${domain.name} as ${selectedRole?.name}.`
                  )}
                </p>
                
                {/* Price Display */}
                <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto mb-6">
                  <div className="text-sm text-gray-600 mb-1">
                    {domain.id === 'maven-hub' && selectedRole?.id === 'maven' ? 'Maven Investment' : 'Identity Verification Fee'}
                  </div>
                  <div className="text-2xl font-medium text-gray-900">{selectedRole?.price || '10 USD'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {domain.id === 'maven-hub' ? (
                      selectedRole?.id === 'maven'
                        ? 'Minimum investment to become a Maven'
                        : selectedRole?.id === 'visitor'
                        ? '30-day access + identity verification'
                        : 'Identity verification for ' + selectedRole?.name
                    ) : (
                      'One-time payment for ' + selectedRole?.name + ' role'
                    )}
                  </div>
                </div>
                
                {/* Payment Button */}
                <button
                  onClick={proceedToConfirmation}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
                >
                  Make Payment
                </button>
                
                {/* Skip Link - For demo/testing only */}
                <div className="text-sm">
                  <button
                    onClick={proceedToConfirmation}
                    className="text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Skip for now
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Demo mode only</p>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="text-center py-8">
                <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ready to Join!
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600">Domain</div>
                    <div className="font-medium text-gray-900">{domain.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Selected Role</div>
                    <div className="font-medium text-gray-900">{selectedRole?.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{selectedRole?.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            
            {((currentStep === 'role-selection' && selectedRole && isAlreadyJoined) || 
              currentStep === 'confirmation') && (
              <button
                onClick={handleJoinDomain}
                disabled={isProcessing}
                className={cn(
                  "px-6 py-2 bg-blue-600 text-white rounded-md",
                  "hover:bg-blue-700 transition-colors",
                  "flex items-center gap-2",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    {isAlreadyJoined ? 'Switch Domain' : 'Join Domain'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
  );
}