'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Content } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommentSection from '@/components/CommentSection';
import FeedItem from './FeedItem';

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

export default function Feed({ setActiveTab }: FeedProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

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

  const handleLike = (postId: string) => {
    if (!session?.user) {
      alert('Please sign in to like posts');
      return;
    }
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleComment = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleShare = (postId: string) => {
    console.log(`Shared post: ${postId}`);
  };

  const handleSave = (postId: string) => {
    console.log(`Saved post: ${postId}`);
  };

  const handleReport = (postId: string) => {
    console.log(`Reported post: ${postId}`);
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
      <ErrorBoundary fallback={<ErrorFallback />}>
        <div className="space-y-6">
          {content.map((post) => (
            <div key={post.id}>
              <FeedItem
                post={{
                  ...post,
                  likes: (post.likes || 0) + (likedPosts.has(post.id) ? 1 : 0),
                  comments: post.comments || 0
                }}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onSave={handleSave}
                onReport={handleReport}
                setActiveTab={setActiveTab}
              />
              {expandedComments.has(post.id) && (
                <ErrorBoundary fallback={<div className="p-4 bg-red-50 text-red-700">Error loading comments</div>}>
                  <CommentSection postId={post.id} />
                </ErrorBoundary>
              )}
            </div>
          ))}
        </div>
      </ErrorBoundary>
    </div>
  );
}
