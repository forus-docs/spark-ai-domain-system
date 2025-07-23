'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { useDomain } from '@/app/contexts/domain-context';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Users, 
  FileText, 
  CheckSquare, 
  BarChart3,
  FolderTree,
  X
} from 'lucide-react';
import { DomainSelector } from '@/app/components/domain-selector';
import { RecentItems } from '@/app/components/recent-items';
import { UserProfile } from '@/app/components/user-profile';
import type { Chat } from '@/app/contexts/chat-context';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresDomain: boolean;
  order: number;
}

const navigationItems: NavItem[] = [
  { id: 'home', name: 'Home', href: '/', icon: Home, requiresDomain: true, order: 1 }, // Changed to require domain
  { id: 'domains', name: 'Domains', href: '/domains', icon: FolderTree, requiresDomain: false, order: 2 },
  { id: 'organogram', name: 'Organogram', href: '/organogram', icon: Users, requiresDomain: true, order: 3 },
  { id: 'teams', name: 'Teams', href: '/teams', icon: Users, requiresDomain: true, order: 4 },
  { id: 'procedures', name: 'Procedures', href: '/procedures', icon: FileText, requiresDomain: true, order: 5 },
  { id: 'tasks', name: 'Tasks', href: '/tasks', icon: CheckSquare, requiresDomain: true, order: 6 },
  { id: 'dashboards', name: 'Dashboards', href: '/dashboards', icon: BarChart3, requiresDomain: true, order: 7 },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentDomain } = useDomain();

  const filteredNavItems = navigationItems
    .filter(item => !item.requiresDomain || currentDomain)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="relative flex flex-col h-screen bg-white border-r border-gray-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {/* Mobile Close Button - Left Side since drawer opens from right */}
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
          <Image
            src="/forus-logo.svg"
            alt="Forus"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h1 className="text-lg font-medium text-gray-900">
            FOR<span className="font-black">US</span> Spark AI
          </h1>
        </div>
      </div>

      {/* Domain Selector */}
      <div className="p-3 border-b border-gray-200">
        <DomainSelector onSelect={onClose} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md transition-colors text-sm",
                    isActive
                      ? "bg-gray-100 text-gray-900"
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

      {/* Recent Items */}
      <RecentItems 
        onChatClick={(chat) => {
          // Navigate to the process detail page with chat parameter
          if (chat.domainId && chat.processId) {
            router.push(`/domains/${chat.domainId}/processes/${chat.processId}?startChat=true&chatId=${chat.id}`);
            onClose?.();
          }
        }}
      />

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200">
        <UserProfile onNavigate={onClose} />
      </div>
    </div>
  );
}