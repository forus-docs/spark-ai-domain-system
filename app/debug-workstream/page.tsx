'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth-context';

export default function DebugWorkstreamPage() {
  const { accessToken } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchDebugInfo();
    }
  }, [accessToken]);

  const fetchDebugInfo = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/workstream', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch debug info');
      console.error('Debug fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAdoptScript = async () => {
    alert('Please run this command in your terminal:\n\nnpx tsx scripts/auto-adopt-workstream.ts');
  };

  const testWorkstreamCreate = async () => {
    if (!accessToken || !debugInfo?.debug?.currentDomainId) {
      alert('No access token or domain ID');
      return;
    }

    try {
      const response = await fetch('/api/debug/test-workstream-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          domainId: debugInfo.debug.currentDomainId
        })
      });

      const data = await response.json();
      console.log('Test result:', data);
      alert(`Test Result:\n${JSON.stringify(data.debug, null, 2)}`);
    } catch (err) {
      console.error('Test error:', err);
      alert('Test failed - check console');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading debug information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={fetchDebugInfo}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>No debug information available. Please login first.</p>
      </div>
    );
  }

  const { debug, recommendation } = debugInfo;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workstream Debug Information</h1>

        {/* Recommendation Alert */}
        {recommendation && (
          <div className={`mb-6 p-4 rounded-lg ${
            recommendation.includes('No workstream task') 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <p className={`font-semibold ${
              recommendation.includes('No workstream task') ? 'text-red-800' : 'text-green-800'
            }`}>
              {recommendation}
            </p>
            {recommendation.includes('No workstream task') && (
              <button
                onClick={runAdoptScript}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Show Fix Command
              </button>
            )}
          </div>
        )}

        {/* User Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">User ID:</span> {debug.userId}</p>
            <p><span className="font-medium">User Name:</span> {debug.userName}</p>
            <p><span className="font-medium">Current Domain ID:</span> {debug.currentDomainId || 'None'}</p>
            {debug.currentDomainDetails && (
              <>
                <p><span className="font-medium">Current Domain Name:</span> {debug.currentDomainDetails.name}</p>
                <p><span className="font-medium">Current Domain Slug:</span> {debug.currentDomainDetails.slug}</p>
              </>
            )}
            <p><span className="font-medium">Is Member of Current Domain:</span> {debug.isUserMemberOfCurrentDomain ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* User Domains */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User&apos;s Domains</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domain ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debug.userDomains?.map((domain: any, index: number) => (
                  <tr key={index} className={domain.domainId === debug.currentDomainId ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 text-sm font-mono">{domain.domainId}</td>
                    <td className="px-4 py-2 text-sm">{domain.domainName}</td>
                    <td className="px-4 py-2 text-sm">{domain.role}</td>
                    <td className="px-4 py-2 text-sm">{new Date(domain.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workstream Tasks in Current Domain */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Workstream Tasks in Current Domain</h2>
          {debug.workstreamTasksInCurrentDomain?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Master Task ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {debug.workstreamTasksInCurrentDomain.map((task: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm font-mono">{task.id}</td>
                      <td className="px-4 py-2 text-sm">{task.name}</td>
                      <td className="px-4 py-2 text-sm">{task.taskType}</td>
                      <td className="px-4 py-2 text-sm font-mono">{task.masterTaskId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No workstream tasks found in current domain</p>
          )}
          
          {/* Test Button */}
          <div className="mt-4">
            <button
              onClick={testWorkstreamCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Workstream Query
            </button>
          </div>
        </div>

        {/* All Workstream Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">All Workstream Tasks in Database</h2>
          {debug.allWorkstreamTasksInDatabase?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domain ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domain Name</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {debug.allWorkstreamTasksInDatabase.map((task: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm font-mono">{task.id}</td>
                      <td className="px-4 py-2 text-sm">{task.name}</td>
                      <td className="px-4 py-2 text-sm font-mono">{task.domainId}</td>
                      <td className="px-4 py-2 text-sm">{task.domainName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No workstream tasks found in any domain</p>
          )}
        </div>

        {/* Master Task */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Master Workstream Task</h2>
          {debug.masterWorkstreamTask ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">ID:</span> {debug.masterWorkstreamTask.id}</p>
              <p><span className="font-medium">Master Task ID:</span> {debug.masterWorkstreamTask.masterTaskId}</p>
              <p><span className="font-medium">Name:</span> {debug.masterWorkstreamTask.name}</p>
              <p><span className="font-medium">Task Type:</span> {debug.masterWorkstreamTask.taskType}</p>
            </div>
          ) : (
            <p className="text-gray-500">No master workstream task found</p>
          )}
        </div>
      </div>
    </div>
  );
}