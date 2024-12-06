// src/components/Feed/Feed.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Flag,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Content, MembershipTier } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';

interface FeedProps {
  setActiveTab: (tab: string) => void;
}

const ErrorFallback = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <Alert variant="destructive">
      <AlertDescription>
        Something went wrong while loading the feed. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  </div>
);

const VideoErrorFallback = () => (
  <div className="p-4 bg-red-50 text-red-700 rounded-lg">
    <p>Error loading video player. Please try refreshing the page.</p>
  </div>
);

const CommentsErrorFallback = () => (
  <div className="p-4 bg-red-50 text-red-700 rounded-lg">
    <p>Error loading comments section. Please try refreshing the page.</p>
  </div>
);

export default function Feed({ setActiveTab }: FeedProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setContent(data.data);
        } else {
          throw new Error('Invalid content data structure');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      alert('Please sign in to like posts');
      return;
    }

    try {
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return <ErrorFallback />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="space-y-6">
        {content.map((post) => {
          const dateInfo = formatDate(post.createdAt);
          const postContent = post.content || post.description || '';

          return (
            <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-lg text-black">{post.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' : 
                      post.tier === 'allAccess' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.tier.charAt(0).toUpperCase() + post.tier.slice(1)}
                    </span>
                    {dateInfo.isNew && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full text-xs font-medium text-yellow-800">
                        <Sparkles className="w-3 h-3" />
                        New
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{dateInfo.text}</span>
                </div>
              </div>

              {/* Video Content */}
              {post.type === 'video' && post.mediaContent?.video?.videoId && (
                <ErrorBoundary fallback={<VideoErrorFallback />}>
                  <VideoPlayer
                    key={post.mediaContent.video.videoId}
                    videoId={post.mediaContent.video.videoId}
                    thumbnail={post.mediaContent.video.thumbnail}
                    title={post.title}
                    requiredTier={post.tier as MembershipTier}
                    setActiveTab={setActiveTab}
                    onPlay={() => console.log('Video playing:', post.title)}
                    onPause={() => console.log('Video paused:', post.title)}
                    onEnded={() => console.log('Video ended:', post.title)}
                    onError={(error) => console.error('Video error:', error)}
                  />
                </ErrorBoundary>
              )}

              {/* Post Content */}
              <div className="p-4">
                <p className={`text-gray-800 ${!expandedPosts.has(post.id) && 'line-clamp-3'}`}>
                  {postContent}
                </p>
                {postContent.length > 150 && (
                  <button
                    onClick={() => togglePostExpansion(post.id)}
                    className="text-yellow-600 hover:text-yellow-700 text-sm mt-2 flex items-center gap-1"
                  >
                    {expandedPosts.has(post.id) ? (
                      <>Show less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Read more <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 ${
                      likedPosts.has(post.id) ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{(post.likes || 0) + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </button>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-yellow-500"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-yellow-500">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-600 hover:text-yellow-500">
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <button className="text-gray-600 hover:text-red-500">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <ErrorBoundary fallback={<CommentsErrorFallback />}>
                  <CommentSection postId={post.id} />
                </ErrorBoundary>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}