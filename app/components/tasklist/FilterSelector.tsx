'use client';

import { useState, useEffect, useContext } from 'react';
import { ChevronDown, Filter as FilterIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { CamundaContext } from '@/app/contexts/camunda-context';
import { Filter } from './core/TaskListContainer';

interface FilterSelectorProps {
  selectedFilterId: string | null;
  onFilterSelect: (filterId: string | null, filter?: Filter | null) => void;
}

export function FilterSelector({ selectedFilterId, onFilterSelect }: FilterSelectorProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<string, number>>({});
  
  const camundaContext = useContext(CamundaContext);
  const currentUser = camundaContext?.currentUser;

  // Fetch filters
  const fetchFilters = async () => {
    try {
      setLoading(true);
      
      const authHeader: HeadersInit = { 'Content-Type': 'application/json' };
      if (currentUser) {
        authHeader['X-Camunda-Auth'] = btoa(`${currentUser.username}:${currentUser.password}`);
      }

      const response = await fetch('/api/camunda/filters', {
        method: 'GET',
        headers: authHeader,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFilters(data);
        
        // Auto-select first filter if none selected
        if (!selectedFilterId && data.length > 0) {
          onFilterSelect(data[0].id, data[0]);
        }
        
        // Fetch counts for all filters
        fetchFilterCounts(data, authHeader);
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts for all filters
  const fetchFilterCounts = async (filters: Filter[], authHeader: HeadersInit) => {
    const counts: Record<string, number> = {};
    
    await Promise.all(
      filters.map(async (filter) => {
        try {
          const response = await fetch(`/api/camunda/filters/${filter.id}/count`, {
            method: 'GET',
            headers: authHeader,
            credentials: 'include',
          });
          
          if (response.ok) {
            const { count } = await response.json();
            counts[filter.id] = count;
          }
        } catch (error) {
          counts[filter.id] = 0;
        }
      })
    );
    
    setFilterCounts(counts);
  };

  useEffect(() => {
    if (currentUser) {
      fetchFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const selectedFilter = filters.find(f => f.id === selectedFilterId);
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md animate-pulse">
        <FilterIcon className="w-4 h-4" />
        <span className="text-sm">Loading filters...</span>
      </div>
    );
  }

  if (filters.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-gray-500">
        <FilterIcon className="w-4 h-4" />
        <span className="text-sm">No filters available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm",
          selectedFilterId ? "border-orange-500" : "border-gray-300"
        )}
      >
        <FilterIcon className="w-4 h-4" />
        <span className="font-medium">
          {selectedFilter?.name || 'All Tasks'}
        </span>
        {selectedFilterId && filterCounts[selectedFilterId] !== undefined && (
          <span className="text-gray-500">({filterCounts[selectedFilterId]})</span>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="p-2">
              <button
                onClick={() => {
                  onFilterSelect(null, null);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 transition-colors text-left",
                  !selectedFilterId && "bg-orange-50"
                )}
              >
                <span className="text-sm font-medium">All Tasks</span>
              </button>
              
              <div className="my-1 border-t border-gray-200" />
              
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    onFilterSelect(filter.id, filter);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 transition-colors text-left",
                    selectedFilterId === filter.id && "bg-orange-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {filter.name}
                    </div>
                    {filter.properties.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {filter.properties.description}
                      </div>
                    )}
                  </div>
                  {filterCounts[filter.id] !== undefined && (
                    <span className="text-sm text-gray-500 ml-2">
                      {filterCounts[filter.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {filters.some(f => f.properties.refresh) && (
              <>
                <div className="border-t border-gray-200" />
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-1 text-xs text-gray-500">
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-refresh enabled filters</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}