'use client';

import { useState } from 'react';
import { Sidebar } from '@/app/components/sidebar';
import { WorkstreamDrawer } from '@/app/components/workstream-drawer';
import { SparkAppBar } from '@/app/components/spark-app-bar';
import { BPMSidebar } from '@/app/components/bpm-sidebar';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/app/components/protected-route';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workstreamDrawerOpen, setWorkstreamDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { currentDomain } = useDomain();
  const pathname = usePathname();
  
  // Determine if we should show BPM sidebar
  const showBPMSidebar = currentDomain?.slug === 'bpm';
  
  // Don't show sidebar on auth pages or invite pages
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth');
  const isInvitePage = pathname.startsWith('/invite/');
  
  if (isAuthPage || isInvitePage) {
    return <>{children}</>;
  }

  // For all other pages, require authentication
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-14 md:pt-0">
        {/* Workstream Drawer */}
        <WorkstreamDrawer 
          isOpen={workstreamDrawerOpen} 
          onClose={() => setWorkstreamDrawerOpen(false)} 
        />
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar - Opens from Right */}
        <div className={`
          fixed inset-y-0 right-0 z-50
          w-80
          transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          transition-transform duration-300 ease-in-out
        `}>
          {showBPMSidebar ? (
            <BPMSidebar onClose={() => setSidebarOpen(false)} />
          ) : (
            <Sidebar onClose={() => setSidebarOpen(false)} />
          )}
        </div>
        
        {/* Standardized App Bar - Show on all pages except auth pages */}
        <SparkAppBar 
          onMenuClick={() => setSidebarOpen(true)}
          onPlusClick={() => setWorkstreamDrawerOpen(true)}
        />
        
        {/* Main Content */}
        {children}
      </div>
    </ProtectedRoute>
  );
}