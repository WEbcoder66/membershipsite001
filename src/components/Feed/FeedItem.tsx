'use client';

import React, { memo } from 'react';
import { ThumbsUp, MessageCircle, Lock } from 'lucide-react';
import { Content } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import PhotoGallery from '@/components/PhotoGallery';
import AudioPlayer from '@/components/Feed/AudioPlayer';
import PollComponent from '@/components/Feed/PollComponent';
import { useSession } from 'next-auth/react';

interface FeedItemProps {
  post: Content;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  setActiveTab: (tab: string) => void;
}

function FeedItemBase({ post, onLike, onComment, setActiveTab }: FeedItemProps) {
  const { data: session } = useSession();
  const userTier = session?.user?.membershipTier ?? 'basic';

  const requiredIndex = ['basic', 'premium', 'allAccess'].indexOf(post.tier);
  const userIndex = ['basic', 'premium', 'allAccess'].indexOf(userTier);
  const hasAccess = userIndex >= requiredIndex;

  const isLockedAndNoAccess = post.isLocked && !hasAccess;

  const renderContent = () => {
    switch (post.type) {
      case 'video':
        if (post.mediaContent?.video) {
          return (
            <div className="relative">
              {isLockedAndNoAccess && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                  <div className="text-center p-6 text-white">
                    <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">
                      Requires {post.tier} Access
                    </h3>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                    >
                      Upgrade Membership
                    </button>
                  </div>
                </div>
              )}
              <VideoPlayer
                videoId={post.mediaContent.video.videoId}
                thumbnail={post.mediaContent.video.thumbnail}
                requiredTier={post.tier}
                setActiveTab={setActiveTab}
                locked={isLockedAndNoAccess}
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
              {isLockedAndNoAccess && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                  <div className="text-center p-6 text-white">
                    <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">
                      Requires {post.tier} Access
                    </h3>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                    >
                      Upgrade Membership
                    </button>
                  </div>
                </div>
              )}
              <PhotoGallery images={images} />
            </div>
          );
        }
        return null;

      case 'audio':
        if (post.mediaContent?.audio) {
          return (
            <div className="p-4 relative">
              {isLockedAndNoAccess && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                  <div className="text-center p-6 text-white">
                    <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">
                      Requires {post.tier} Access
                    </h3>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                    >
                      Upgrade Membership
                    </button>
                  </div>
                </div>
              )}
              {!isLockedAndNoAccess && (
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
            <div className="p-4 relative">
              {isLockedAndNoAccess && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                  <div className="text-center p-6 text-white">
                    <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">
                      Requires {post.tier} Access
                    </h3>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                    >
                      Upgrade Membership
                    </button>
                  </div>
                </div>
              )}
              {!isLockedAndNoAccess && (
                <PollComponent
                  options={post.mediaContent.poll.options}
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
          <div className="p-4 relative">
            {isLockedAndNoAccess && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                <div className="text-center p-6 text-white">
                  <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">
                    Requires {post.tier} Access
                  </h3>
                  <button
                    onClick={() => setActiveTab('membership')}
                    className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                  >
                    Upgrade Membership
                  </button>
                </div>
              </div>
            )}
            {!isLockedAndNoAccess && <p className="text-gray-800">{post.description}</p>}
          </div>
        );
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
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
