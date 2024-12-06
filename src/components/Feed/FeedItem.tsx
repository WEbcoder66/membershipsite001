// src/components/Feed/FeedItem.tsx
'use client';
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
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Post, MembershipTier } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';
import VideoPlayer from '@/components/VideoPlayer';
import ImageGallery from './ImageGallery';
import AudioPlayer from './AudioPlayer';
import PollComponent from './PollComponent';
import PaymentButton from '@/components/PaymentButton';
import ErrorBoundary from '@/components/ErrorBoundary';

interface FeedItemProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function FeedItem({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onReport,
  setActiveTab
}: FeedItemProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const dateInfo = formatDate(post.createdAt);

  const renderContent = () => {
    if (post.type === 'video' && post.mediaContent?.video?.videoId) {
      return (
        <ErrorBoundary fallback={<div>Error loading video</div>}>
          <VideoPlayer
            videoId={post.mediaContent.video.videoId}
            thumbnail={post.mediaContent.video.thumbnail}
            title={post.title}
            requiredTier={post.tier as MembershipTier}
            setActiveTab={setActiveTab}
          />
        </ErrorBoundary>
      );
    }

    if (post.type === 'gallery' && post.mediaContent?.gallery) {
      return <ImageGallery images={post.mediaContent.gallery.images} />;
    }

    if (post.type === 'audio' && post.mediaContent?.audio) {
      return (
        <AudioPlayer
          url={post.mediaContent.audio.url}
          duration={post.mediaContent.audio.duration}
        />
      );
    }

    if (post.type === 'poll' && post.mediaContent?.poll) {
      return (
        <PollComponent
          options={post.mediaContent.poll.options}
          endDate={post.mediaContent.poll.endDate}
          multipleChoice={post.mediaContent.poll.multipleChoice}
        />
      );
    }

    return null;
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-black">{post.title}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${
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

      {/* Content */}
      {renderContent()}

      {/* Description */}
      <div className="p-4">
        {post.description && (
          <>
            <p className={`text-gray-700 ${!isExpanded && 'line-clamp-2'}`}>
              {post.description}
            </p>
            {post.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-yellow-600 hover:text-yellow-700 text-sm mt-2 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Read more <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>{formatNumber(post.likes)}</span>
          </button>
          <button
            onClick={() => onComment(post.id)}
            className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{formatNumber(post.comments)}</span>
          </button>
          <button
            onClick={() => onShare(post.id)}
            className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(post.id)}
            className="text-gray-600 hover:text-yellow-600"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => onReport(post.id)}
            className="text-gray-600 hover:text-red-600"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
}