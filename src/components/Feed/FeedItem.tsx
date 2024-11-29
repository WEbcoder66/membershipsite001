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
import VideoPlayer from './VideoPlayer';
import ImageGallery from './ImageGallery';
import AudioPlayer from './AudioPlayer';
import PollComponent from './PollComponent';
import PaymentButton from '@/components/PaymentButton';

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

  const hasAccess = () => {
    if (!user) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as MembershipTier] || 0;
    const contentTierLevel = tierLevels[post.tier];
    return userTierLevel >= contentTierLevel;
  };

  const badgeColors: Record<MembershipTier, string> = {
    basic: 'bg-yellow-100 text-yellow-800',
    premium: 'bg-yellow-200 text-yellow-900',
    allAccess: 'bg-yellow-300 text-yellow-900'
  };

  const TierBadge = () => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[post.tier]}`}>
      {post.tier.charAt(0).toUpperCase() + post.tier.slice(1)}
    </span>
  );

  const LockOverlay = () => (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="text-center p-6">
        <Lock className="w-8 h-8 text-white mx-auto mb-2" />
        <p className="text-white mb-4">
          Subscribe to {post.tier} tier to unlock this content
        </p>
        <PaymentButton
          price={19.99}
          name={`${post.tier} Membership`}
          type="subscription"
          contentId={post.tier}
          className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
        />
      </div>
    </div>
  );

  const renderContent = () => {
    if (!hasAccess()) {
      return (
        <div className="relative">
          <div className="aspect-video bg-gray-100" />
          <LockOverlay />
        </div>
      );
    }

    if (!post.mediaContent) return null;

    switch (post.type) {
      case 'video':
        return post.mediaContent.video && (
          <VideoPlayer
            url={post.mediaContent.video.url}
            thumbnail={post.mediaContent.video.thumbnail}
            duration={post.mediaContent.video.duration}
            requiredTier={post.tier}
            setActiveTab={setActiveTab}
          />
        );
      case 'gallery':
        return post.mediaContent.gallery && (
          <ImageGallery images={post.mediaContent.gallery.images} />
        );
      case 'audio':
        return post.mediaContent.audio && (
          <AudioPlayer
            url={post.mediaContent.audio.url}
            duration={post.mediaContent.audio.duration}
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
      default:
        return null;
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-black">{post.title}</h2>
            <TierBadge />
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
      </div>

      {/* Interactions */}
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

      {/* Comments Section */}
      {showComments && (
        <div className="border-t p-4">
          {/* Add comments section here */}
        </div>
      )}
    </article>
  );
}