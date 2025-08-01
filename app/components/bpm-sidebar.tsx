'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { useDomain } from '@/app/contexts/domain-context';
import { UserProfile } from '@/app/components/user-profile';
import { 
  X, 
  Home, 
  ClipboardList,
  Activity,
  Settings,
  FileText,
  BarChart3,
  Users
} from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  order: number;
}

const bpmNavigationItems: NavItem[] = [
  { id: 'home', name: 'Home', href: '', icon: Home, order: 1 },
  { id: 'tasklist', name: 'Tasklist', href: '/tasklist', icon: ClipboardList, order: 2 },
  { id: 'processes', name: 'Processes', href: '/processes', icon: Activity, order: 3 },
  { id: 'reports', name: 'Reports', href: '/reports', icon: FileText, order: 4 },
  { id: 'dashboards', name: 'Dashboards', href: '/dashboards', icon: BarChart3, order: 5 },
  { id: 'teams', name: 'Teams', href: '/teams', icon: Users, order: 6 },
  { id: 'admin', name: 'Admin', href: '/admin', icon: Settings, order: 7 },
];

interface BPMSidebarProps {
  onClose?: () => void;
}

export function BPMSidebar({ onClose }: BPMSidebarProps) {
  const pathname = usePathname();
  const { currentDomain } = useDomain();

  const buildHref = (item: NavItem) => {
    if (currentDomain?.slug) {
      return `/${currentDomain.slug}${item.href}`;
    }
    return item.href;
  };

  return (
    <div className="relative flex flex-col h-screen bg-white border-r border-gray-200 w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">BPM</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">NetBuild BPM</h1>
              <p className="text-xs text-gray-500">Powered by Camunda</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5">
            {bpmNavigationItems.map((item) => {
              const Icon = item.icon;
              const href = buildHref(item);
              const isActive = pathname === href;
              
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md transition-colors text-sm",
                      isActive
                        ? "bg-orange-100 text-orange-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200">
          <UserProfile onNavigate={onClose} />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Connected to Camunda 7.20.0
          </div>
        </div>
      </div>
  );
}