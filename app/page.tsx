'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ChevronRight, Sparkles, RefreshCw, Bug } from 'lucide-react';
import { PostCard } from '@/app/components/post-card';
import { UserPostDisplay, MasterPost } from '@/app/types/post.types';
import { DebugPopup } from '@/app/components/debug-popup';

function HomePage() {
  const router = useRouter();
  const { currentDomain, isLoading: isDomainLoading } = useDomain();
  const { user, accessToken } = useAuth();
  const [userPosts, setUserPosts] = useState<UserPostDisplay[]>([]);
  const [unassignedPosts, setUnassignedPosts] = useState<MasterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  
  

  useEffect(() => {
    // Only redirect if user is authenticated, domains are loaded, and no domain is selected
    // This prevents redirect on refresh when domains are still loading
    if (user && !isDomainLoading && !currentDomain) {
      router.push('/domains');
    }
  }, [user, currentDomain, isDomainLoading, router]);

  // Fetch posts
  useEffect(() => {
    if (!user || !accessToken) return;
    
    // Safety check - ensure user has id
    if (!user.id) {
      return;
    }

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (currentDomain) {
          params.append('domain', currentDomain.id);
        }

        
        const response = await fetch(`/api/posts?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        setUserPosts(data.posts || []);
      } catch (error) {
        // Error fetching posts
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [user, accessToken, currentDomain]);

  // Fetch unassigned posts for all domains (user-initiated assignment)
  useEffect(() => {
    if (!user || !accessToken || !currentDomain) return;

    const fetchUnassignedPosts = async () => {
      try {
        // Fetch all master posts for the current domain
        const params = new URLSearchParams({
          domain: currentDomain.id
        });
        
        const response = await fetch(`/api/posts/master?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          // Failed to fetch master posts
          return;
        }
        
        const data = await response.json();
        
        // Filter out posts that are already assigned to the user
        const assignedPostIds = userPosts.map(p => p.postId);
        const unassignedMasterPosts = data.posts.filter((mp: MasterPost) => 
          !assignedPostIds.includes(mp.id)
        );
        
        setUnassignedPosts(unassignedMasterPosts);
      } catch (error) {
        // Error fetching master posts
      }
    };

    fetchUnassignedPosts();
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

  const handlePostClick = async (post: UserPostDisplay | MasterPost) => {
    
    // Check if this is a master post (unassigned)
    const isMasterPost = !('userId' in post);
    
    if (isMasterPost) {
      // This is a master post - need to assign it first
      
      try {
        const response = await fetch('/api/posts/assign', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: post.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          // Failed to assign post
          alert('Failed to assign post. Please try again.');
          return;
        }

        
        // Refresh posts to get the newly assigned UserPost
        const postsResponse = await fetch(`/api/posts?domain=${currentDomain?.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (!postsResponse.ok) {
          // Failed to refresh posts
          return;
        }
        
        const postsData = await postsResponse.json();
        setUserPosts(postsData.posts || []);
        
        // Find the newly created UserPost
        const newUserPost = postsData.posts.find((p: UserPostDisplay) => 
          p.postId === post.id
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
      await handleUserPostClick(post as UserPostDisplay);
    }
  };

  const handleUserPostClick = async (post: UserPostDisplay) => {
    
    // Mark as viewed
    await fetch(`/api/posts/${post.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Check if post has a process - navigate to process detail page
    if (post.processId) {
      router.push(`/process/${post.processId}`);
      return;
    }

    // Handle navigation based on action type for non-process posts
    const action = post.masterPost.ctaAction;
    switch (action.type) {
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
  
  // Separate ID verification posts from regular posts
  const verificationUserPosts = userPosts.filter(p => p.masterPost?.postType === 'identity_verification');
  const verificationUnassignedPosts = unassignedPosts.filter(p => p.postType === 'identity_verification');
  
  // Filter out verification posts from regular categories
  const nonVerificationUserPosts = userPosts.filter(p => p.masterPost?.postType !== 'identity_verification');
  const nonVerificationUnassignedPosts = unassignedPosts.filter(p => p.postType !== 'identity_verification');
  
  // Group regular posts by category
  const requiredUserPosts = nonVerificationUserPosts.filter(p => p.masterPost?.category === 'required');
  const recommendedUserPosts = nonVerificationUserPosts.filter(p => p.masterPost?.category === 'recommended');
  const optionalUserPosts = nonVerificationUserPosts.filter(p => p.masterPost?.category === 'optional');
  
  // Group unassigned regular posts by category
  const requiredUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'required');
  const recommendedUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'recommended');
  const optionalUnassignedPosts = nonVerificationUnassignedPosts.filter(p => p.category === 'optional');
  

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