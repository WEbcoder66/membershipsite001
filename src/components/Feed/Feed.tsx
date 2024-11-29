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
import Image from 'next/image';
import { Content } from '@/lib/types';
import { getAllContent } from '@/lib/contentService';
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

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const loadedContent = getAllContent();
      setContent(loadedContent);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = (contentTier: string) => {
    if (!user?.membershipTier) return false;
    const tiers = { basic: 1, premium: 2, allAccess: 3 };
    return tiers[user.membershipTier as keyof typeof tiers] >= tiers[contentTier as keyof typeof tiers];
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

  const handleLike = (postId: string) => {
    if (!user) {
      alert('Please sign in to like posts');
      return;
    }
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
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
                <VideoPlayer
                  url={post.mediaContent.video.url}
                  thumbnail={post.mediaContent.video.thumbnail}
                  title={post.title}
                  requiredTier={post.tier}
                  duration={post.mediaContent.video.duration}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <div className="p-4">
                  {!canAccess(post.tier) ? (
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