'use client';

import Link from 'next/link';
import { useDomain } from '@/app/contexts/domain-context';
import { useChat } from '@/app/contexts/chat-context';
import { Clock, FileText, Users, CheckSquare, MessageSquare } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { Chat } from '@/app/contexts/chat-context';

interface RecentItem {
  id: string;
  title: string;
  type: 'procedure' | 'task' | 'team';
  href: string;
  timestamp: string;
  domainId: string;
}

// Mock recent items data - In production, this would come from an API
const mockRecentItems: RecentItem[] = [
  {
    id: '1',
    title: 'Customer Onboarding Process',
    type: 'procedure',
    href: '/procedures/customer-onboarding',
    timestamp: '2 hours ago',
    domainId: 'maven-hub'
  },
  {
    id: '2',
    title: 'Update Product Catalog',
    type: 'task',
    href: '/tasks/update-catalog',
    timestamp: '3 hours ago',
    domainId: 'maven-hub'
  },
  {
    id: '3',
    title: 'Marketing Team',
    type: 'team',
    href: '/teams/marketing',
    timestamp: '5 hours ago',
    domainId: 'maven-hub'
  },
  {
    id: '4',
    title: 'Compliance Review',
    type: 'procedure',
    href: '/procedures/compliance-review',
    timestamp: '1 day ago',
    domainId: 'wealth-on-wheels'
  },
  {
    id: '5',
    title: 'Sales Dashboard Update',
    type: 'task',
    href: '/tasks/sales-dashboard',
    timestamp: '1 day ago',
    domainId: 'bemnet'
  }
];

const itemTypeIcons = {
  procedure: FileText,
  task: CheckSquare,
  team: Users,
};

interface RecentItemsProps {
  onChatClick?: (chat: Chat) => void;
}

export function RecentItems({ onChatClick }: RecentItemsProps = {}) {
  const { currentDomain } = useDomain();
  const { recentChats } = useChat();

  // Filter chats by current domain
  const filteredChats = currentDomain
    ? recentChats.filter(chat => chat.domainId === currentDomain.id)
    : [];

  if (filteredChats.length === 0) {
    return (
      <div className="p-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-1">Recent</div>
        <div className="text-xs text-gray-400">
          {currentDomain ? 'No recent chats in this domain' : 'Select a domain to see recent chats'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-gray-200">
      <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Recent Chats
      </div>
      <ul className="space-y-1">
        {filteredChats.slice(0, 5).map((chat) => {
          const timeAgo = getTimeAgo(chat.lastMessageAt);
          
          return (
            <li key={chat.id}>
              <div
                onClick={() => onChatClick?.(chat)}
                className={cn(
                  "flex items-start gap-2 p-1.5 rounded-md",
                  "text-xs text-gray-700 hover:bg-gray-50",
                  "transition-colors group cursor-pointer"
                )}
              >
                <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 group-hover:text-gray-600" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium group-hover:text-gray-900">
                    {chat.processName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {timeAgo} • {chat.messageCount} messages
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}