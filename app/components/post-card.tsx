'use client';

import { cn } from '@/app/lib/utils';
import { UserPostDisplay, MasterPost } from '@/app/types/post.types';
import { 
  Shield, 
  BookOpen, 
  CheckSquare, 
  Trophy, 
  Megaphone, 
  Lightbulb, 
  Briefcase, 
  Users,
  Clock,
  Lock,
  Plus
} from 'lucide-react';

interface PostCardProps {
  post: UserPostDisplay | MasterPost;
  onClick: () => void;
  isUnassigned?: boolean;
}

const iconMap = {
  shield: Shield,
  book: BookOpen,
  checklist: CheckSquare,
  trophy: Trophy,
  megaphone: Megaphone,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  users: Users,
};

const colorSchemes = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    border: 'border-gray-200',
  },
};

export function PostCard({ post, onClick, isUnassigned }: PostCardProps) {
  // Determine if this is a master post or user post
  const isMasterPost = !('userId' in post);
  
  // Get the post data (either from masterPost property or the post itself)
  const postData = isMasterPost ? post : (post as UserPostDisplay).masterPost;
  const isNew = !isMasterPost && (post as UserPostDisplay).isNew;
  const ctaEnabled = isMasterPost ? true : (post as UserPostDisplay).ctaEnabled;
  const isCompleted = !isMasterPost && (post as UserPostDisplay).isCompleted;
  
  const Icon = iconMap[postData.iconType || 'checklist'];
  const colorScheme = colorSchemes[postData.colorScheme || 'blue'];

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200',
        'cursor-pointer group relative',
        isCompleted && 'opacity-75',
        isUnassigned && 'border-dashed border-2'
      )}
    >
      {/* New badge */}
      {isNew && !isCompleted && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
          New
        </div>
      )}
      
      {/* Unassigned badge */}
      {isUnassigned && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Plus className="w-3 h-3" />
          Assign
        </div>
      )}

      <div onClick={onClick} className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'p-2 rounded-lg flex-shrink-0',
          colorScheme.bg
        )}>
          <Icon className={cn('w-5 h-5', colorScheme.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium text-gray-900 text-sm mb-1',
            isCompleted && 'line-through'
          )}>
            {postData.title}
          </h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {postData.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {postData.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{postData.estimatedTime}</span>
              </div>
            )}
            {postData.reward && (
              <span className="font-medium text-green-600">
                {postData.reward.displayText}
              </span>
            )}
            {!ctaEnabled && (
              <div className="flex items-center gap-1 text-orange-600">
                <Lock className="w-3 h-3" />
                <span>Verification required</span>
              </div>
            )}
          </div>

          {/* Priority indicator */}
          {postData.priority === 'urgent' && !isCompleted && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Urgent
            </div>
          )}
        </div>

      </div>

      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Completed
          </div>
        </div>
      )}
    </div>
  );
}