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
  const tiers = ['free', 'premium', 'allAccess'];
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
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            Premium Content
          </h3>
          <p className="text-gray-300 mb-6">
            This content is available for premium members
          </p>
          
          <button
            onClick={() => setActiveTab('membership')}
            className="bg-yellow-400 px-6 py-2.5 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
          >
            Upgrade to premium
          </button>
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
              <div className={contentLocked ? "filter blur-sm" : ""}>
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
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-black">{post.title}</h2>
          {/* Change 'basic' to 'free' here */}
          {post.tier !== 'free' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {post.tier}
            </span>
          )}
        </div>
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
