// src/components/PostCard.tsx
import React from 'react';
import Image from 'next/image';
import { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  // Get the appropriate image source based on post type
  const getImageSource = () => {
    if (post.mediaContent?.video?.thumbnail) {
      return post.mediaContent.video.thumbnail;
    }
    if (post.mediaContent?.photo?.images?.[0]) {
      return post.mediaContent.photo.images[0];  // Updated 'gallery' to 'photo'
    }
    if (post.coverImageUrl) {
      return post.coverImageUrl;
    }
    if (post.thumbnailUrl) {
      return post.thumbnailUrl;
    }
    return '/api/placeholder/800/450';
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative aspect-video">
        <Image 
          src={getImageSource()}
          alt={post.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="font-bold text-xl text-black">{post.title}</h3>
        <p className="mt-2 text-black">{post.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-black">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
          <button className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500">
            {post.isLocked ? 'Unlock Now' : 'Read More'}
          </button>
        </div>
      </div>
    </article>
  );
}
