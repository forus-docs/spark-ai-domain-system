'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function ClearStorageButton() {
  const router = useRouter();

  const clearEverything = async () => {
    if (!confirm('This will clear your session and log you out. Continue?')) {
      return;
    }

    try {
      // Clear server-side session by calling logout
      console.log('Clearing server session...');
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.log('Logout API call failed:', e);
      }

      // Clear all client-side cookies for this domain (backup)
      console.log('Clearing client-side cookies...');
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      alert('Session cleared! Redirecting to home...');
      
      // Force reload to clear any in-memory state
      window.location.href = '/';
    } catch (error) {
      console.error('Error clearing session:', error);
      alert('Error clearing session. Check console for details.');
    }
  };

  return (
    <button
      onClick={clearEverything}
      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
      title="Clear server session and logout"
    >
      <Trash2 className="w-4 h-4" />
      <span className="text-sm">Clear Session</span>
    </button>
  );
}