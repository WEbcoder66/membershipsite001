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
        <div className="
          relative
          w-[250px]
          aspect-square
          rounded-full
          flex flex-col items-center justify-center text-center text-white p-6
          bg-[radial-gradient(circle,_#001354_30%,_#000035_100%)]
        ">
          <Lock className="w-8 h-8 text-white mb-4" />
          <h3 className="text-xl font-bold mb-2">Premium Content</h3>
          <p className="text-sm text-gray-200 mb-4">
            This content is available for premium members
          </p>
          <button
            onClick={() => setActiveTab('membership')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded"
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
            <div className="relative">
              {contentLocked && renderLockedOverlay()}
              <VideoPlayer
                videoId={post.mediaContent.video.videoId}
                thumbnail={post.mediaContent.video.thumbnail}
                requiredTier={post.tier}
                setActiveTab={setActiveTab}
                locked={contentLocked}
              />
            </div>
          );
        }
        return null;

      case 'photo':
        if (post.mediaContent?.photo) {
          const images = post.mediaContent.photo.images;
          return (
            <div className="relative">
              {contentLocked && renderLockedOverlay()}
              {!contentLocked && <PhotoGallery images={images} />}
            </div>
          );
        }
        return null;

      case 'audio':
        if (post.mediaContent?.audio) {
          return (
            <div className="relative p-4">
              {contentLocked && renderLockedOverlay()}
              {!contentLocked && (
                <AudioPlayer
                  url={post.mediaContent.audio.url}
                  duration={post.mediaContent.audio.duration || 'Unknown'}
                />
              )}
            </div>
          );
        }
        return null;

      case 'poll':
        if (post.mediaContent?.poll) {
          return (
            <div className="relative p-4">
              {contentLocked && renderLockedOverlay()}
              {!contentLocked && (
                <PollComponent
                  options={post.mediaContent.poll.options || {}}
                  endDate={post.mediaContent.poll.endDate}
                  multipleChoice={post.mediaContent.poll.multipleChoice}
                  postId={post.id}
                />
              )}
            </div>
          );
        }
        return null;

      case 'post':
      default:
        return (
          <div className="relative p-4">
            {post.isLocked && contentLocked && renderLockedOverlay()}
            {!post.isLocked || !contentLocked ? (
              <p className="text-gray-800">{post.description}</p>
            ) : (
              <p className="text-gray-500 italic">Content locked. Upgrade to view.</p>
            )}
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
