'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useDomain } from '@/app/contexts/domain-context';
import { useCamunda } from '@/app/contexts/camunda-context';
import { cn } from '@/app/lib/utils';

interface TaskFiltersProps {
  filters: {
    assignee: 'all' | 'me' | 'unassigned';
    processDefinition: string;
    searchTerm: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [processDefinitions, setProcessDefinitions] = useState<
    Array<{ key: string; name: string }>
  >([]);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { currentDomain } = useDomain();
  
  // Try to use Camunda context if available
  let camundaUser = null;
  try {
    const camundaContext = useCamunda();
    camundaUser = camundaContext.currentUser;
  } catch (e) {
    // Not in Camunda context
  }

  useEffect(() => {
    if (currentDomain?.slug === 'bpm') {
      fetchProcessDefinitions();
    }
  }, [currentDomain]);

  // Focus input when search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchExpanded) {
        setSearchExpanded(false);
        // Clear search when closing
        handleSearchChange('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchExpanded]);

  const fetchProcessDefinitions = async () => {
    if (currentDomain?.slug !== 'bpm') return;
    
    try {
      const headers: HeadersInit = {};
      
      // Add Camunda auth if available
      if (camundaUser) {
        headers['X-Camunda-Auth'] = btoa(`${camundaUser.username}:${camundaUser.password}`);
      }
      
      const response = await fetch('/api/camunda/tasks', { headers });
      if (response.ok) {
        const data = await response.json();
        setProcessDefinitions(data);
      }
    } catch (error) {
      console.error('Error fetching process definitions:', error);
    }
  };

  const handleAssigneeChange = (value: 'all' | 'me' | 'unassigned') => {
    onFiltersChange({ ...filters, assignee: value });
  };

  const handleProcessChange = (value: string) => {
    onFiltersChange({ ...filters, processDefinition: value });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">
        {/* Assignee Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
          <select
            value={filters.assignee}
            onChange={(e) => handleAssigneeChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="me">My Tasks</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        {/* Process Definition Filter */}
        <select
          value={filters.processDefinition}
          onChange={(e) => handleProcessChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Processes</option>
          {processDefinitions.map((pd) => (
            <option key={pd.key} value={pd.key}>
              {pd.name}
            </option>
          ))}
        </select>

        {/* Spacer to push search to the right */}
        <div className="flex-1" />

        {/* Search Icon Placeholder */}
        <div className="w-8 h-8" />
      </div>

      {/* Expandable Search Overlay */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full flex items-center bg-white border border-gray-300 rounded-md overflow-hidden transition-all duration-300 ease-in-out z-10",
          searchExpanded ? "left-10 sm:left-12" : "w-8"
        )}
      >
        {searchExpanded && (
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm focus:outline-none"
          />
        )}
        <button
          onClick={() => {
            if (searchExpanded) {
              setSearchExpanded(false);
              handleSearchChange('');
            } else {
              setSearchExpanded(true);
            }
          }}
          className="p-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {searchExpanded ? (
            <X className="w-4 h-4 text-gray-500" />
          ) : (
            <Search className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}