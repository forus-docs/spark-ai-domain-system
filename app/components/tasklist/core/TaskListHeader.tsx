'use client';

import { 
  LayoutGrid, 
  List, 
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { SortConfig } from './TaskListContainer';

interface TaskListHeaderProps {
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  selectedCount: number;
  totalCount: number;
}

const sortOptions: Array<{ field: SortConfig['field']; label: string }> = [
  { field: 'created', label: 'Created Date' },
  { field: 'due', label: 'Due Date' },
  { field: 'followUp', label: 'Follow-up Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'name', label: 'Task Name' },
  { field: 'assignee', label: 'Assignee' },
];

export function TaskListHeader({
  viewMode,
  onViewModeChange,
  sortConfig,
  onSort,
  selectedCount,
  totalCount,
}: TaskListHeaderProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const currentSortLabel = sortOptions.find(opt => opt.field === sortConfig.field)?.label || 'Sort';

  return (
    <div className="flex items-center gap-2">
      {/* Selection Count */}
      {selectedCount > 0 && (
        <span className="text-sm text-gray-600 mr-4">
          {selectedCount} of {totalCount} selected
        </span>
      )}

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setSortMenuOpen(!sortMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
        >
          <span>{currentSortLabel}</span>
          {sortConfig.order === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {sortMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSortMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-20">
              {sortOptions.map(option => (
                <button
                  key={option.field}
                  onClick={() => {
                    onSort(option.field);
                    setSortMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50",
                    sortConfig.field === option.field && "bg-gray-50"
                  )}
                >
                  <span>{option.label}</span>
                  {sortConfig.field === option.field && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center border rounded-md">
        <button
          onClick={() => onViewModeChange('card')}
          className={cn(
            "p-1.5 transition-colors",
            viewMode === 'card' 
              ? "bg-gray-100 text-gray-900" 
              : "text-gray-500 hover:text-gray-700"
          )}
          title="Card view"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={cn(
            "p-1.5 transition-colors",
            viewMode === 'table' 
              ? "bg-gray-100 text-gray-900" 
              : "text-gray-500 hover:text-gray-700"
          )}
          title="Table view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}