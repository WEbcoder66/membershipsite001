// src/components/Feed/FeedItem.tsx
'use client';

import React, { memo } from 'react';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { Content } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import PhotoGallery from '@/components/PhotoGallery';
import AudioPlayer from '@/components/Feed/AudioPlayer';
import PollComponent from '@/components/Feed/PollComponent';

interface FeedItemProps {
  post: Content;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  setActiveTab: (tab: string) => void;
}

function FeedItemBase({ post, onLike, onComment, setActiveTab }: FeedItemProps) {
  const renderContent = () => {
    switch (post.type) {
      case 'video':
        if (post.mediaContent?.video) {
          return (
            <div className="relative">
              <VideoPlayer
                videoId={post.mediaContent.video.videoId}
                thumbnail={post.mediaContent.video.thumbnail}
                requiredTier={post.tier}
                setActiveTab={setActiveTab}
              />
            </div>
          );
        }
        return null;

      case 'photo':
        if (post.mediaContent?.photo) {
          const images = post.mediaContent.photo.images;
          return (
            <div className="p-4">
              <PhotoGallery images={images} title={post.title} />
            </div>
          );
        }
        return null;

      case 'audio':
        if (post.mediaContent?.audio) {
          return (
            <div className="p-4">
              <AudioPlayer
                url={post.mediaContent.audio.url}
                duration={post.mediaContent.audio.duration || 'Unknown'}
              />
            </div>
          );
        }
        return null;

      case 'poll':
        if (post.mediaContent?.poll) {
          return (
            <div className="p-4">
              <PollComponent
                options={post.mediaContent.poll.options}
                endDate={post.mediaContent.poll.endDate}
                multipleChoice={post.mediaContent.poll.multipleChoice}
                postId={post.id}
              />
            </div>
          );
        }
        return null;

      case 'post':
      default:
        return (
          <div className="p-4">
            {post.description && <p className="text-gray-800">{post.description}</p>}
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
