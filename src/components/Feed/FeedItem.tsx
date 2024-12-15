// src/components/Feed/FeedItem.tsx
'use client';

import React, { memo } from 'react';
import { ThumbsUp, MessageCircle, Lock } from 'lucide-react';
import { Content } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import PhotoGallery from '@/components/PhotoGallery';
import AudioPlayer from '@/components/Feed/AudioPlayer';
import PollComponent from '@/components/Feed/PollComponent';
import { useSession } from 'next-auth/react';

function hasAccess(userTier: string, contentTier: string): boolean {
  const tiers = ['basic', 'premium', 'allAccess'];
  const userIndex = tiers.indexOf(userTier);
  const contentIndex = tiers.indexOf(contentTier);
  return userIndex >= contentIndex;
}

interface FeedItemProps {
  post: Content;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  setActiveTab: (tab: string) => void;
}

function FeedItemBase({ post, onLike, onComment, setActiveTab }: FeedItemProps) {
  const { data: session } = useSession();
  const userTier = session?.user?.membershipTier;
  const contentLocked = !userTier || !hasAccess(userTier, post.tier);

  const renderLockedOverlay = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60">
        <div className="w-[300px] flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-navy-900" />
          </div>
          
          <div className="bg-[#0a0b1f] p-6 rounded-lg w-full">
            <h3 className="text-xl font-bold text-white mb-2">
              Premium Content
            </h3>
            <p className="text-gray-300 mb-4">
              This content is available for premium members
            </p>
            
            <button
              onClick={() => setActiveTab('membership')}
              className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (post.type) {
      case 'video':
        if (post.mediaContent?.video) {
          return (
            <div className="relative w-full aspect-video">
              {contentLocked && renderLockedOverlay()}
              <div className={`w-full h-full ${contentLocked ? "filter blur-sm" : ""}`}>
                <VideoPlayer
                  videoId={post.mediaContent.video.videoId}
                  thumbnail={post.mediaContent.video.thumbnail}
                  requiredTier={post.tier}
                  setActiveTab={setActiveTab}
                  locked={contentLocked}
                />
              </div>
            </div>
          );
        }
        return null;

      case 'photo':
        if (post.mediaContent?.photo) {
          return (
            <div className="relative">
              {contentLocked && renderLockedOverlay()}
              <div className={contentLocked ? "filter blur-sm" : ""}>
                <PhotoGallery images={post.mediaContent.photo.images} />
              </div>
            </div>
          );
        }
        return null;

      case 'audio':
        if (post.mediaContent?.audio) {
          return (
            <div className="relative p-4">
              {contentLocked && renderLockedOverlay()}
              <div className={contentLocked ? "filter blur-sm" : ""}>
                <AudioPlayer
                  url={post.mediaContent.audio.url}
                  duration={post.mediaContent.audio.duration || 'Unknown'}
                />
              </div>
            </div>
          );
        }
        return null;

      case 'poll':
        if (post.mediaContent?.poll) {
          return (
            <div className="relative p-4">
              {contentLocked && renderLockedOverlay()}
              <div className={contentLocked ? "filter blur-sm" : ""}>
                <PollComponent
                  options={post.mediaContent.poll.options || {}}
                  endDate={post.mediaContent.poll.endDate}
                  multipleChoice={post.mediaContent.poll.multipleChoice}
                  postId={post.id}
                />
              </div>
            </div>
          );
        }
        return null;

      case 'post':
      default:
        return (
          <div className="relative p-4">
            {contentLocked && renderLockedOverlay()}
            <div className={contentLocked ? "filter blur-sm" : ""}>
              <p className="text-gray-800">{post.description}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden relative">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg text-black">{post.title}</h2>
      </div>
      {renderContent()}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>{post.likes ?? 0}</span>
          </button>
          <button
            onClick={() => onComment(post.id)}
            className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments ?? 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const FeedItem = memo(FeedItemBase);
export default FeedItem;