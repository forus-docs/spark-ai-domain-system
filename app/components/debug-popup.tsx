'use client';

import { useState, useEffect } from 'react';
import { X, Bug, Copy, Check } from 'lucide-react';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';

interface DebugPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPopup({ isOpen, onClose }: DebugPopupProps) {
  const { user, accessToken } = useAuth();
  const { currentDomain, joinedDomains } = useDomain();
  const [copied, setCopied] = useState(false);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setCookies(document.cookie);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const debugData = {
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      currentDomainId: user?.currentDomainId,
      domains: user?.domains,
      identity: user?.identity,
    },
    auth: {
      hasAccessToken: !!accessToken,
      tokenLength: accessToken?.length,
    },
    domain: {
      currentDomainId: currentDomain?.id,
      currentDomainName: currentDomain?.name,
      joinedDomainsCount: joinedDomains.length,
      joinedDomains: joinedDomains.map(d => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
      })),
    },
    storage: {
      cookies: {
        note: 'HTTP-only cookies cannot be read by JavaScript',
        accessToken: 'HTTP-only (check middleware/API)',
        refreshToken: 'HTTP-only (check middleware/API)',
        intendedDomain: 'HTTP-only (check middleware/API)'
      },
    },
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Debug: User Persistence</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* User State */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">User State (Database Structure)</h3>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1">
                <div>user.id: <span className="text-blue-600">{user?.id || 'null'}</span></div>
                <div>user.email: <span className="text-blue-600">{user?.email || 'null'}</span></div>
                <div>user.name: <span className="text-blue-600">{user?.name || 'null'}</span></div>
                <div>user.currentDomainId: <span className="text-blue-600">{user?.currentDomainId || 'null'}</span></div>
                <div>user.domains: <span className="text-blue-600">[{user?.domains?.length || 0} items]</span></div>
                <div className="ml-4">
                  {user?.domains?.map((d, i) => (
                    <div key={i} className="text-gray-600">
                      - domainId: {d.domainId}, role: {d.role}
                    </div>
                  ))}
                </div>
                <div>user.identity: <span className="text-purple-600">{user?.identity ? 'Object' : 'null'}</span></div>
                {user?.identity && (
                  <div className="ml-4 space-y-1">
                    <div>user.identity.isVerified: <span className={user.identity.isVerified ? 'text-green-600' : 'text-red-600'}>{String(user.identity.isVerified)}</span></div>
                    {user.identity.verifiedAt && <div>user.identity.verifiedAt: <span className="text-blue-600">{new Date(user.identity.verifiedAt).toISOString()}</span></div>}
                    {user.identity.verificationType && <div>user.identity.verificationType: <span className="text-blue-600">{user.identity.verificationType}</span></div>}
                    {user.identity.verificationLevel && <div>user.identity.verificationLevel: <span className="text-blue-600">{user.identity.verificationLevel}</span></div>}
                  </div>
                )}
              </div>
            </section>

            {/* Auth State */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Authentication</h3>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1">
                <div>Access Token: <span className={accessToken ? 'text-green-600' : 'text-red-600'}>{accessToken ? 'exists' : 'missing'}</span></div>
                {accessToken && <div>Token Length: <span className="text-blue-600">{accessToken.length} chars</span></div>}
              </div>
            </section>

            {/* Domain Context */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Domain Context</h3>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1">
                <div>Current Domain: <span className="text-blue-600">{currentDomain?.name || 'null'}</span></div>
                <div>Current Domain ID: <span className="text-blue-600">{currentDomain?.id || 'null'}</span></div>
                <div>Joined Domains: <span className="text-blue-600">{joinedDomains.length}</span></div>
                {joinedDomains.map((d, i) => (
                  <div key={i} className="ml-4">
                    - {d.name} ({d.slug})
                  </div>
                ))}
              </div>
            </section>

            {/* Storage */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Storage Persistence (Server-Side Only)</h3>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-2">
                <div>
                  <div className="font-semibold mb-1">HTTP-only Cookies:</div>
                  <div className="ml-4 space-y-1 text-gray-600">
                    <div className="text-xs italic mb-2">{debugData.storage.cookies.note}</div>
                    <div>accessToken: <span className="text-blue-600">{debugData.storage.cookies.accessToken}</span></div>
                    <div>refreshToken: <span className="text-blue-600">{debugData.storage.cookies.refreshToken}</span></div>
                    <div>intendedDomain: <span className="text-blue-600">{debugData.storage.cookies.intendedDomain}</span></div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded text-blue-800">
                  <div className="font-semibold">Note:</div>
                  <div>All authentication and session data is now stored server-side using HTTP-only cookies for enhanced security.</div>
                </div>
              </div>
            </section>

            {/* Raw Data */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Raw Debug Data</h3>
              <pre className="bg-gray-900 text-gray-100 rounded p-3 text-xs overflow-x-auto">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}