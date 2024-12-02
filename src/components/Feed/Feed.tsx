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
  Sparkles
} from 'lucide-react';
import { Content } from '@/lib/types';
import VideoPlayer from '@/components/Feed/VideoPlayer';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/lib/utils';

interface FeedProps {
  setActiveTab: (tab: string) => void;
}

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
        const data = await response.json();
        console.log('Video URLs:', data.data.map((item: any) => ({
          title: item.title,
          url: item?.mediaContent?.video?.url,
          thumbnail: item?.mediaContent?.video?.thumbnail
        })));
        setContent(data.data || []);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const hasAccess = (requiredTier: string): boolean => {
    if (!user?.membershipTier) return false;
    const tiers = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tiers[user.membershipTier as keyof typeof tiers] || 0;
    const requiredLevel = tiers[requiredTier as keyof typeof tiers] || 0;
    return userTierLevel >= requiredLevel;
  };

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
      // Here you would typically make an API call to update the like status
      // await updateLikeStatus(postId);
      
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
      alert('Failed to update like status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">No content available</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="space-y-6">
        {content.map((post) => {
          const dateInfo = formatDate(post.createdAt);

          return (
            <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
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

              {post.type === 'video' && post.mediaContent?.video ? (
                <div className="aspect-video relative">
                  {user && hasAccess(post.tier) ? (
                    <video
                      className="w-full h-full"
                      controls
                      playsInline
                      poster={post.mediaContent.video.thumbnail}
                    >
                      <source 
                        src={post.mediaContent.video.url} 
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="w-12 h-12 mx-auto mb-2" />
                        <p>This content is for {post.tier} members</p>
                        <button
                          onClick={() => setActiveTab('membership')}
                          className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-lg"
                        >
                          Upgrade to {post.tier}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {!hasAccess(post.tier) ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 mb-4">
                        This content is available for {post.tier} members
                      </p>
                      <button
                        onClick={() => setActiveTab('membership')}
                        className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500"
                      >
                        Upgrade to {post.tier}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-gray-800 ${!expandedPosts.has(post.id) && 'line-clamp-3'}`}>
                        {post.content || post.description}
                      </p>
                      {(post.content || post.description).length > 150 && (
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
                    </>
                  )}
                </div>
              )}

              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 ${
                      likedPosts.has(post.id) ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </button>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-yellow-500"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
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

              {expandedComments.has(post.id) && (
                <CommentSection postId={post.id} />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}