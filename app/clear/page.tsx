'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear server session immediately
    console.log('🧹 Clearing server session...');
    
    // Clear server-side session
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => console.log('✓ Server session cleared'))
      .catch(e => console.log('⚠️ Logout API failed:', e));
    
    // Clear all client-side cookies (backup)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('✓ Client cookies cleared');
    
    // Redirect after a moment
    setTimeout(() => {
      router.push('/domains');
    }, 1000);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Clearing session...</h1>
        <p className="text-gray-600">You will be redirected to the home page.</p>
      </div>
    </div>
  );
}