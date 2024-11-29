'use client';
import ContentCreator from './ContentCreator';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Flag,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import ImageGallery from './ImageGallery';
import PollComponent from './PollComponent';
import CommentSection from '../CommentSection';
import { Post } from '@/lib/types';

interface FeedProps {
  setActiveTab: (tab: string) => void;
}

// Demo posts data
const posts: Post[] = [
  // ... your existing posts array
];

export default function Feed({ setActiveTab }: FeedProps) {
  const { user } = useAuth();
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const renderContent = (post: Post) => {
    if (!post.mediaContent) return null;

    switch (post.type) {
      case 'video':
        return post.mediaContent.video && (
          <VideoPlayer
            url={post.mediaContent.video.url}
            thumbnail={post.mediaContent.video.thumbnail}
            title={post.title}
            requiredTier={post.tier}
            duration={post.mediaContent.video.duration}
            setActiveTab={setActiveTab}
          />
        );
      case 'poll':
        return post.mediaContent.poll && (
          <PollComponent
            options={post.mediaContent.poll.options}
            endDate={post.mediaContent.poll.endDate}
            multipleChoice={post.mediaContent.poll.multipleChoice}
          />
        );
      case 'gallery':
        return post.mediaContent.gallery && (
          <ImageGallery
            images={post.mediaContent.gallery.images}
          />
        );
      case 'audio':
        return post.mediaContent.audio && (
          <AudioPlayer
            url={post.mediaContent.audio.url}
            duration={post.mediaContent.audio.duration}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Add Content Creator for admins */}
      {user?.isAdmin && (
        <div className="mb-8">
          <ContentCreator />
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
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
                </div>
                <span className="text-sm text-gray-600">
                  {formatTimestamp(post.createdAt)}
                </span>
              </div>
            </div>

            {renderContent(post)}

            <div className="p-4">
              <p className={`text-gray-800 ${!expandedPosts.has(post.id) && 'line-clamp-2'}`}>
                {post.description}
              </p>
              {post.description.length > 150 && (
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
        ))}
      </div>
    </div>
  );
}