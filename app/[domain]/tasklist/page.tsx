'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { CamundaProvider, useCamunda } from '@/app/contexts/camunda-context';
import { TaskListContainer } from '@/app/components/tasklist/core/TaskListContainer';
import { TaskDetails } from '@/app/components/tasklist/TaskDetails';
import { TaskFilters } from '@/app/components/tasklist/TaskFilters';
import { UserSwitcherChip } from '@/app/components/tasklist/UserSwitcherChip';
import { FilterSelector } from '@/app/components/tasklist/FilterSelector';

function TasklistContent() {
  const { currentDomain } = useDomain();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const camundaContext = useCamunda();
  const camundaUser = camundaContext?.currentUser;
  
  // Get task ID from URL params for mobile navigation
  const taskIdFromUrl = searchParams.get('task');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const [filterState, setFilterState] = useState({
    assignee: 'all' as 'all' | 'me' | 'unassigned',
    processDefinition: 'all',
    searchTerm: ''
  });
  
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<any>(null);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle task selection based on device
  const handleTaskSelect = (taskId: string) => {
    if (isMobile) {
      // On mobile, navigate to task detail page
      router.push(`/${currentDomain?.slug}/tasklist?task=${taskId}`);
    } else {
      // On desktop, show in split view
      setSelectedTaskId(taskId);
    }
  };

  // Handle closing task details
  const handleCloseTask = () => {
    if (isMobile) {
      // On mobile, go back to list
      router.push(`/${currentDomain?.slug}/tasklist`);
    } else {
      // On desktop, just close the panel
      setSelectedTaskId(null);
    }
  };

  useEffect(() => {
    if (!currentDomain) {
      router.push('/domains');
    }
  }, [currentDomain, router]);

  // Sync URL param with selected task (for mobile)
  useEffect(() => {
    if (taskIdFromUrl && isMobile) {
      setSelectedTaskId(taskIdFromUrl);
    } else if (!taskIdFromUrl && isMobile) {
      setSelectedTaskId(null);
    }
  }, [taskIdFromUrl, isMobile]);

  if (!currentDomain) {
    return null;
  }

  // Mobile: Show either list OR details (full screen)
  if (isMobile) {
    if (selectedTaskId) {
      return (
        <div className="bg-white">
          <TaskDetails
            taskId={selectedTaskId}
            onClose={handleCloseTask}
            onTaskComplete={() => {
              handleCloseTask();
            }}
            currentUser={camundaUser?.username || user?.email || 'demo'}
            isMobile={true}
          />
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Tasklist</h1>
          <FilterSelector 
            selectedFilterId={selectedFilterId}
            onFilterSelect={(id, filter) => {
              setSelectedFilterId(id);
              setSelectedFilter(filter);
            }}
          />
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow-sm border border-gray-200">
          <TaskFilters 
            filters={filterState}
            onFiltersChange={setFilterState}
          />
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <TaskListContainer
            filters={filterState}
            selectedTaskId={null} // No selection state on mobile
            onTaskSelect={handleTaskSelect}
            currentUser={camundaUser?.username || user?.email || 'demo'}
            selectedFilterId={selectedFilterId}
            selectedFilter={selectedFilter}
          />
        </div>
      </div>
    );
  }

  // Desktop: Camunda-style split view
  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-gray-50">
      {/* Left panel - Task list */}
      <div className="w-1/2 lg:w-2/5 border-r border-gray-300 bg-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Tasklist</h1>
            <div className="flex items-center gap-3">
              <FilterSelector 
                selectedFilterId={selectedFilterId}
                onFilterSelect={(id, filter) => {
                  setSelectedFilterId(id);
                  setSelectedFilter(filter);
                }}
              />
              <UserSwitcherChip />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-200">
          <TaskFilters 
            filters={filterState}
            onFiltersChange={setFilterState}
          />
        </div>

        {/* Task List - scrollable */}
        <div className="flex-1 min-h-0">
          <TaskListContainer
            filters={filterState}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            currentUser={camundaUser?.username || user?.email || 'demo'}
            selectedFilterId={selectedFilterId}
            selectedFilter={selectedFilter}
          />
        </div>
      </div>

      {/* Right panel - Task details */}
      <div className="flex-1 lg:w-3/5 bg-white">
        {selectedTaskId ? (
          <TaskDetails
            taskId={selectedTaskId}
            onClose={handleCloseTask}
            onTaskComplete={() => {
              setSelectedTaskId(null);
            }}
            currentUser={camundaUser?.username || user?.email || 'demo'}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasklistPage() {
  const { currentDomain } = useDomain();
  
  // Only render with CamundaProvider if we're in BPM domain
  if (currentDomain?.slug === 'bpm') {
    return (
      <CamundaProvider>
        <TasklistContent />
      </CamundaProvider>
    );
  }
  
  // For non-BPM domains, render without Camunda
  return <TasklistContent />;
}