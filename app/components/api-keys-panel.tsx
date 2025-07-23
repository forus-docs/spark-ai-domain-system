'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth-context';
import { cn } from '@/app/lib/utils';
import { Key, Trash2, Plus, Copy, Check, X } from 'lucide-react';

interface ApiKey {
  name: string;
  lastChars: string;
  expiresAt?: string;
}

export function ApiKeysPanel() {
  const { accessToken } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('30');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!accessToken) return;
      
      try {
        const response = await fetch('/api/keys', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, [accessToken]);

  const fetchApiKeys = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('/api/keys', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!accessToken || !newKeyName) return;

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          expiresIn: parseInt(newKeyExpiry),
        }),
      });

      const data = await response.json();
      if (data.key) {
        setGeneratedKey(data.key);
        setNewKeyName('');
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const deleteApiKey = async (name: string) => {
    if (!accessToken) return;

    try {
      await fetch(`/api/keys?name=${name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setGeneratedKey('');
    setNewKeyName('');
    setNewKeyExpiry('30');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Key
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No API keys yet</p>
          <p className="text-sm mt-1">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{key.name}</p>
                <p className="text-sm text-gray-500">
                  •••• {key.lastChars}
                  {key.expiresAt && ` • Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => deleteApiKey(key.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Key Modal - Full screen on mobile */}
      {showAddModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-white flex flex-col">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-medium text-gray-900">
                {!generatedKey ? 'Create API Key' : 'API Key Created'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {!generatedKey ? (
                <>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires In
                    </label>
                    <select
                      value={newKeyExpiry}
                      onChange={(e) => setNewKeyExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createApiKey}
                    disabled={!newKeyName}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md transition-colors",
                      newKeyName
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Create Key
                  </button>
                </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    Save this key securely. You won&apos;t be able to see it again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white border border-gray-300 rounded text-xs break-all">
                      {generatedKey}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {copiedKey ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}