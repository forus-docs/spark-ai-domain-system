'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ChevronRight, Sparkles, RefreshCw, Bug } from 'lucide-react';
import { PostCard } from '@/app/components/post-card';
import { UserTaskDisplay, MasterTask } from '@/app/types/post.types';
import { DebugPopup } from '@/app/components/debug-popup';

function HomePage() {
  const router = useRouter();
  const { currentDomain, isLoading: isDomainLoading } = useDomain();
  const { user, accessToken } = useAuth();
  const [userPosts, setUserPosts] = useState<UserTaskDisplay[]>([]);
  const [unassignedPosts, setUnassignedPosts] = useState<MasterTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  
  

  useEffect(() => {
    // Only redirect if user is authenticated, domains are loaded, and no domain is selected
    // This prevents redirect on refresh when domains are still loading
    if (user && !isDomainLoading && !currentDomain) {
      console.log('[HomePage] Redirecting to /domains - no currentDomain selected');
      router.push('/domains');
    }
  }, [user, currentDomain, isDomainLoading, router]);

  // Fetch user's assigned tasks
  useEffect(() => {
    if (!user || !accessToken) return;
    
    // Safety check - ensure user has id
    if (!user.id) {
      console.log('[HomePage] No user.id available');
      return;
    }

    const fetchUserTasks = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (currentDomain) {
          params.append('domain', currentDomain.id);
        }

        console.log('[HomePage] Fetching user tasks with params:', params.toString());
        
        const response = await fetch(`/api/domain-tasks?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('[HomePage] User tasks response status:', response.status);
        
        if (!response.ok) {
          console.error('[HomePage] Failed to fetch user tasks:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('[HomePage] User tasks data:', data);
        setUserPosts(data.tasks || []);
      } catch (error) {
        console.error('[HomePage] Error fetching user tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTasks();
  }, [user, accessToken, currentDomain]);

  // Fetch domain tasks that user can assign to themselves
  useEffect(() => {
    if (!user || !accessToken || !currentDomain) return;

    const fetchDomainTasks = async () => {
      try {
        // Fetch all domain tasks for the current domain
        const params = new URLSearchParams({
          domain: currentDomain.id
        });
        
        console.log('[HomePage] Fetching domain tasks with params:', params.toString());
        
        const response = await fetch(`/api/domain-tasks/master?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('[HomePage] Domain tasks response status:', response.status);

        if (!response.ok) {
          console.error('[HomePage] Failed to fetch domain tasks:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('[HomePage] Domain tasks data:', data);
        
        // Filter out tasks that are already assigned to the user
        const assignedTaskIds = userPosts.map(p => p.domainTaskId);
        const unassignedDomainTasks = data.posts.filter((dt: MasterTask) => 
          !assignedTaskIds.includes(dt.id)
        );
        
        console.log('[HomePage] Unassigned domain tasks after filtering:', unassignedDomainTasks.length);
        setUnassignedPosts(unassignedDomainTasks);
      } catch (error) {
        console.error('[HomePage] Error fetching domain tasks:', error);
      }
    };

    fetchDomainTasks();
  }, [user, accessToken, currentDomain, userPosts]);

  // Show loading state while contexts are initializing
  if (!user || isDomainLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  // If domains are loaded but no domain selected, the useEffect will redirect
  if (!currentDomain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    );
  }

  const handlePostClick = async (post: UserTaskDisplay | MasterTask) => {
    console.log('[HomePage] handlePostClick called with:', {
      id: post.id,
      isMasterPost: !('userId' in post),
      post
    });
    
    // Check if this is a master post (unassigned)
    const isMasterPost = !('userId' in post);
    
    if (isMasterPost) {
      // This is a master post - need to assign it first
      
      try {
        console.log('[HomePage] Assigning task:', { taskId: post.id, post });
        const response = await fetch('/api/domain-tasks/assign', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: post.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[HomePage] Task assignment failed:', error);
          // Failed to assign post
          alert(`Failed to assign post: ${error.error || 'Unknown error'}`);
          return;
        }

        
        // Refresh posts to get the newly assigned UserPost
        const postsResponse = await fetch(`/api/domain-tasks?domain=${currentDomain?.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (!postsResponse.ok) {
          // Failed to refresh posts
          return;
        }
        
        const postsData = await postsResponse.json();
        setUserPosts(postsData.tasks || []);
        
        // Find the newly created UserPost
        const newUserPost = postsData.tasks.find((p: UserTaskDisplay) => 
          p.domainTaskId === post.id
        );
        
        if (newUserPost) {
          // Continue with the regular flow using the UserPost
          await handleUserPostClick(newUserPost);
        }
      } catch (error) {
        // Error assigning post
        alert('An error occurred. Please try again.');
      }
    } else {
      // This is already a UserPost
      await handleUserPostClick(post as UserTaskDisplay);
    }
  };

  const handleUserPostClick = async (post: UserTaskDisplay) => {
    console.log('[HomePage] handleUserPostClick called with:', {
      postId: post.id,
      masterTaskId: post.masterTaskId,
      domainTask: post.domainTask
    });
    
    // Mark as viewed
    await fetch(`/api/domain-tasks/${post.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Check if post has a masterTaskId - create task execution and navigate to chat
    if (post.masterTaskId) {
      try {
        // Create task execution
        const executionResponse = await fetch(`/api/domain-tasks/${post.id}/task-execution`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (executionResponse.ok) {
          const data = await executionResponse.json();
          console.log('[HomePage] Task execution created:', data);
          router.push(`/chat/${data.executionId}`);
        } else {
          const errorData = await executionResponse.json();
          console.error('[HomePage] Failed to create task execution:', {
            status: executionResponse.status,
            error: errorData
          });
          alert(`Failed to create task execution: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating task execution:', error);
      }
      return;
    }

    // Handle navigation based on action type for non-process posts
    const action = post.domainTask?.ctaAction;
    switch (action?.type) {
      case 'navigate':
        router.push(action.target);
        break;
      case 'external':
        window.open(action.target, '_blank');
        break;
      case 'process':
        // This should not happen if processId exists, but keep as fallback
        router.push(`/process/${action.target}`);
        break;
      // TODO: Handle modal type
    }
  };


  
  // Check verification status
  const isVerified = user?.identity?.isVerified || false;
  console.log('[HomePage] User verification status:', {
    isVerified,
    identity: user?.identity,
    userPostsCount: userPosts.length,
    unassignedPostsCount: unassignedPosts.length
  });
  
  // Separate ID verification posts from regular posts
  const verificationUserPosts = userPosts.filter(p => p.domainTask?.taskType === 'identity_verification');
  const verificationUnassignedPosts = unassignedPosts.filter(p => p.taskType === 'identity_verification');
  
  // Filter out verification posts from regular categories
  const nonVerificationUserPosts = userPosts.filter(p => p.domainTask?.taskType !== 'identity_verification');
  const nonVerificationUnassignedPosts = unassignedPosts.filter(p => p.taskType !== 'identity_verification');
  
  // Group regular posts by category
  const requiredUserPosts = nonVerificationUserPosts.filter(p => p.domainTask?.category === 'required');
  const recommendedUserPosts = nonVerificationUserPosts.filter(p => p.domainTask?.category === 'recommended');
  const optionalUserPosts = nonVerificationUserPosts.filter(p => p.domainTask?.category === 'optional');
  
  // Group unassigned regular posts by category
  const requiredUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'required');
  const recommendedUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'recommended');
  const optionalUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'optional');
  
  console.log('[HomePage] Post breakdown:', {
    verification: { user: verificationUserPosts.length, unassigned: verificationUnassignedPosts.length },
    required: { user: requiredUserPosts.length, unassigned: requiredUnassignedPosts.length },
    recommended: { user: recommendedUserPosts.length, unassigned: recommendedUnassignedPosts.length },
    optional: { user: optionalUserPosts.length, unassigned: optionalUnassignedPosts.length }
  });
  

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-light text-gray-900">Your Journey</h2>
          <p className="text-xs text-gray-600">Complete tasks to unlock features</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(true)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Debug User Settings"
          >
            <Bug className="w-4 h-4 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : userPosts.length === 0 && unassignedPosts.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No posts available</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for new content</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ID Verification Section - Always show if not verified */}
          {(!isVerified && (verificationUserPosts.length > 0 || verificationUnassignedPosts.length > 0)) && (
            <div className="mb-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">Identity Verification Required</h3>
                    <p className="text-xs text-amber-700 mb-3">
                      Complete identity verification to unlock all features and participate fully in the ecosystem.
                    </p>
                    <div className="space-y-2">
                      {/* Show unassigned verification posts first */}
                      {verificationUnassignedPosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onClick={() => handlePostClick(post)}
                          isUnassigned={true}
                        />
                      ))}
                      {/* Then show assigned verification posts */}
                      {verificationUserPosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onClick={() => handlePostClick(post)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show verification status banner if verified */}
          {isVerified && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">Identity verified - All features unlocked</p>
            </div>
          )}

          {/* Required Posts */}
          {(requiredUserPosts.length > 0 || requiredUnassignedPosts.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Required</h3>
              <div className="space-y-2">
                {/* Show unassigned posts first */}
                {requiredUnassignedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                    isUnassigned={true}
                  />
                ))}
                {/* Then show assigned user posts */}
                {requiredUserPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recommended Posts */}
          {(recommendedUserPosts.length > 0 || recommendedUnassignedPosts.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Recommended</h3>
              <div className="space-y-2">
                {/* Show unassigned posts first */}
                {recommendedUnassignedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                    isUnassigned={true}
                  />
                ))}
                {/* Then show assigned user posts */}
                {recommendedUserPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Optional Posts */}
          {(optionalUserPosts.length > 0 || optionalUnassignedPosts.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Optional</h3>
              <div className="space-y-2">
                {/* Show unassigned posts first */}
                {optionalUnassignedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                    isUnassigned={true}
                  />
                ))}
                {/* Then show assigned user posts */}
                {optionalUserPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
      
      {/* Debug Popup */}
      <DebugPopup isOpen={showDebug} onClose={() => setShowDebug(false)} />
    </div>
  );
}

export default function Home() {
  return <HomePage />;
}