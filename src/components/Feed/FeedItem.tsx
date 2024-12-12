// src/components/Feed/FeedItem.tsx
'use client';

import React from 'react';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { Content } from '@/lib/types'; // Ensure Content has comments?: number

interface FeedItemProps {
  post: Content; // Use Content instead of Post
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function FeedItem({ post, onLike, onComment, setActiveTab }: FeedItemProps) {
  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg text-black">{post.title}</h2>
      </div>

      {/* Your content display logic here */}

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
