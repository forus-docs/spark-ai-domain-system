'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { ArrowLeft, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { IProcess } from '@/app/models/Process';
import { Markdown } from '@/app/components/markdown';

interface ProcessDetailPageProps {
  params: {
    processId: string;
  };
}

export default function ProcessDetailPage({ params }: ProcessDetailPageProps) {
  const router = useRouter();
  const { processId } = params;
  const { user, accessToken } = useAuth();
  const [process, setProcess] = useState<IProcess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPost, setUserPost] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!processId || !accessToken) return;

    const fetchProcess = async () => {
      try {
        // Fetch process details
        const processResponse = await fetch(`/api/processes/${processId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!processResponse.ok) {
          console.error('Failed to fetch process');
          return;
        }

        const processData = await processResponse.json();
        setProcess(processData.process);

        // Check if user has a post for this process
        const postsResponse = await fetch(`/api/posts?includeCompleted=true`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          const relatedPost = postsData.posts.find((p: any) => p.processId === processId);
          setUserPost(relatedPost);
          
          // Debug: Log the verification requirement
          if (relatedPost) {
            console.log('Process verification check:', {
              processId,
              postSnapshot: relatedPost.postSnapshot,
              requiresVerification: relatedPost.postSnapshot?.requiresIdentityVerification,
              userIsVerified: user?.identity?.isVerified
            });
          }
        }
      } catch (error) {
        console.error('Error fetching process:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcess();
  }, [processId, accessToken]);

  const handleStartProcess = async () => {
    if (!process?.aiAgentAttached) return;

    // If no userPost exists, we need to find and assign the master post first
    if (!userPost) {
      setIsAssigning(true);
      
      try {
        // Find the master post for this process
        const masterPostsResponse = await fetch(`/api/posts/master?domain=all`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!masterPostsResponse.ok) {
          throw new Error('Failed to fetch master posts');
        }

        const masterPostsData = await masterPostsResponse.json();
        const masterPost = masterPostsData.posts.find((p: any) => p.processId === processId);

        if (!masterPost) {
          throw new Error('Master post not found for this process');
        }

        // Assign the post to the user
        console.log('Assigning post:', { postId: masterPost.id, processId });
        
        const assignResponse = await fetch('/api/posts/assign', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: masterPost.id }),
        });

        if (!assignResponse.ok) {
          const errorData = await assignResponse.json();
          console.error('Assignment failed:', errorData);
          throw new Error(errorData.error || 'Failed to assign post to user');
        }

        // Fetch the newly created userPost
        const postsResponse = await fetch(`/api/posts?includeCompleted=true`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!postsResponse.ok) {
          throw new Error('Failed to fetch user posts');
        }

        const postsData = await postsResponse.json();
        const newUserPost = postsData.posts.find((p: any) => p.processId === processId);

        if (!newUserPost) {
          throw new Error('UserPost not found after assignment');
        }

        setUserPost(newUserPost);
        
        // Now create the conversation with the newly assigned post
        const conversationResponse = await fetch(`/api/posts/${newUserPost.id}/conversation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (conversationResponse.ok) {
          const data = await conversationResponse.json();
          router.push(`/chat/${data.conversationId}`);
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (error) {
        console.error('Error starting process:', error);
        alert('Failed to start process. Please try again.');
      } finally {
        setIsAssigning(false);
      }
      return;
    }

    // If userPost exists, proceed normally
    try {
      const response = await fetch(`/api/posts/${userPost.id}/conversation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat/${data.conversationId}`);
      } else {
        console.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error starting process:', error);
    }
  };

  const isVerified = user?.identity?.isVerified || false;
  // Check both masterPost and postSnapshot for verification requirement
  const requiresVerification = userPost?.masterPost?.requiresIdentityVerification || 
                               userPost?.postSnapshot?.requiresIdentityVerification || 
                               false;
  const canStart = !requiresVerification || isVerified;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Process not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay */}
      {isAssigning && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Assigning task to user...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we prepare your workspace</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Process Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-light text-gray-900 mb-2">{process.name}</h1>
            <p className="text-gray-600">{process.description}</p>
          </div>

          {/* Process Details */}
          <div className="mb-8 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Category:</span>
              <span className="font-medium capitalize">{process.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium uppercase">{process.executionModel}</span>
            </div>
            {process.aiAgentAttached && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">AI-Assisted</span>
              </div>
            )}
          </div>

          {/* Introduction Section */}
          {process.intro && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">What to Expect</h2>
              <Markdown content={process.intro} className="text-gray-700" />
            </div>
          )}

          {/* Action Section */}
          <div className="border-t border-gray-200 pt-6">
            {!canStart ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    This process is locked pending Identity Verification
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Please complete identity verification to access this process.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={handleStartProcess}
                  disabled={isAssigning}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? 'Assigning...' : 'Start Process'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}