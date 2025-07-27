'use client';

import { X, Check, Rocket, Users, Shield, TrendingUp, Globe, Zap } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CreateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDomainModal({ isOpen, onClose }: CreateDomainModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-white flex flex-col">
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
              <h2 className="text-base font-semibold text-gray-900">Create Your Own Domain</h2>
            </div>

            {/* Empty space for balance */}
            <div className="w-11"></div>
          </div>
        </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Hero Section */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Transform Your Industry with Network Power
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Create a domain where your members thrive together. Every connection multiplies value for all.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Unite Your Industry</h4>
                    <p className="text-sm text-gray-600">
                      Bring together stakeholders who currently work in silos. Create a digital ecosystem where collaboration is the default.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Exponential Value Creation</h4>
                    <p className="text-sm text-gray-600">
                      Network effects mean each new member increases value for everyone. Watch your domain grow from dozens to thousands.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">AI-Powered Automation</h4>
                    <p className="text-sm text-gray-600">
                      Deploy AI agents that learn from your network&apos;s collective intelligence. Automate workflows that benefit all members.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Shared Infrastructure</h4>
                    <p className="text-sm text-gray-600">
                      Stop paying for tools individually. Share costs across the network while each member gets enterprise-grade capabilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Stories */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Success Stories</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Maven Hub:</span> 2,500 investors creating deals together
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">PACCI:</span> 1,200 businesses unlocking $3 trillion in trade
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Wealth on Wheels:</span> 150 operators cutting costs by 40%
                  </p>
                </div>
              </div>
            </div>

            {/* Perfect For Section */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Perfect For:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Industry Associations</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Trade Organizations</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Professional Networks</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Cooperatives</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Supply Chains</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Communities</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg p-6">
              <h4 className="font-medium mb-2">Ready to Build Your Network?</h4>
              <p className="text-sm text-gray-300 mb-4">
                Join the revolution of collaborative commerce. Let&apos;s discuss how to transform your industry.
              </p>
              <div className="space-y-3">
                <a 
                  href="mailto:domains@forus.digital" 
                  className="block w-full bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-center font-medium"
                >
                  Contact Us: domains@forus.digital
                </a>
                <p className="text-xs text-gray-400 text-center">
                  We&apos;ll help you design, launch, and grow your domain
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}