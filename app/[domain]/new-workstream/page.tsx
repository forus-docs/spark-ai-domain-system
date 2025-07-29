'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface DomainUser {
  id: string;
  name: string;
  email: string;
}

export default function WorkstreamPage() {
  const router = useRouter();
  const { currentDomain } = useDomain();
  const { accessToken } = useAuth();
  const [workstreamName, setWorkstreamName] = useState('');
  const [users, setUsers] = useState<DomainUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentDomain && accessToken) {
      fetchDomainUsers();
    }
  }, [currentDomain, accessToken]);

  const fetchDomainUsers = async () => {
    if (!currentDomain || !accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/domains/${currentDomain.id}/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateWorkstream = async () => {
    if (!currentDomain || !accessToken) return;

    setCreating(true);
    try {
      const response = await fetch('/api/workstreams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          domainId: currentDomain.id,
          name: workstreamName.trim() || `Workstream ${new Date().toLocaleDateString()}`,
          memberIds: Array.from(selectedUsers)
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to chat page with the new workstream ID
        router.push(`/chat/${data.workstream.id}`);
      } else {
        console.error('Failed to create workstream');
      }
    } catch (error) {
      console.error('Error creating workstream:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!currentDomain) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-gray-50">
        <p className="text-gray-500">No domain selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">New Workstream</h1>

        {/* Workstream Name */}
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Workstream Name
          </label>
          <input
            type="text"
            id="name"
            value={workstreamName}
            onChange={(e) => setWorkstreamName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter workstream name"
          />
        </div>

        {/* User Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Add Users
          </label>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found in this domain</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        selectedUsers.has(user.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}>
                        {selectedUsers.has(user.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={handleCreateWorkstream}
            disabled={creating}
            className={cn(
              "w-full px-6 py-3 rounded-md transition-colors text-center",
              !creating
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {creating ? 'Creating...' : 'Create Workstream'}
          </button>
        </div>
      </div>
    </div>
  );
}