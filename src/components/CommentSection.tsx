// src/components/CommentSection.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ThumbsUp, Reply } from 'lucide-react';
import Image from 'next/image';
import { formatTimestamp } from '@/lib/utils';
import { Comment, MembershipTier } from '@/lib/types';

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export default function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments.length > 0 ? initialComments : [
    {
      id: '1',
      postId,
      user: {
        id: 'user1',
        name: 'John Doe',
        avatar: '/images/profiles/default.jpg',
        tier: 'premium'
      },
      content: 'This is amazing content! Really helpful and well-explained.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 24,
      replies: [
        {
          id: 'reply1',
          postId,
          user: {
            id: 'user2',
            name: 'Jane Smith',
            avatar: '/images/profiles/default.jpg',
            tier: 'basic'
          },
          content: 'Totally agree! The production quality is outstanding.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          likes: 12,
        }
      ]
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleAddComment = () => {
    if (!user) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      postId,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar || '/images/profiles/default.jpg',
        tier: user.membershipTier
      },
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setComments(prev => [newCommentObj, ...prev]);
    setNewComment('');
  };

  const handleReply = (commentId: string) => {
    if (!user) {
      alert('Please sign in to reply');
      return;
    }

    if (!replyContent.trim()) return;

    const newReply: Comment = {
      id: Date.now().toString(),
      postId,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar || '/images/profiles/default.jpg',
        tier: user.membershipTier
      },
      content: replyContent.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    }));

    setReplyingTo(null);
    setReplyContent('');
  };

  const getTierBadgeColor = (tier?: MembershipTier) => {
    switch (tier) {
      case 'basic':
        return 'bg-yellow-100 text-yellow-800';
      case 'premium':
        return 'bg-yellow-200 text-yellow-900';
      case 'allAccess':
        return 'bg-yellow-300 text-yellow-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="border-t pt-4">
      {/* Add Comment */}
      <div className="flex gap-4 mb-6">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
          <Image
            src={user?.avatar || '/images/profiles/default.jpg'}
            alt="Your avatar"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Write a comment..." : "Sign in to comment"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 resize-none"
            rows={3}
            disabled={!user}
          />
          <button
            onClick={handleAddComment}
            disabled={!user || !newComment.trim()}
            className={`mt-2 px-4 py-2 rounded-lg font-medium ${
              user && newComment.trim()
                ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
              <Image
                src={comment.user.avatar}
                alt={comment.user.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{comment.user.name}</span>
                  {comment.user.tier && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(comment.user.tier)}`}>
                      {comment.user.tier}
                    </span>
                  )}
                  <span className="text-gray-500 text-sm">
                    • {formatTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800">{comment.content}</p>
              </div>

              {/* Comment Actions */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <button className="flex items-center gap-1 text-gray-500 hover:text-yellow-500">
                  <ThumbsUp className="w-4 h-4" />
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                </button>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-yellow-500"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>

              {/* Reply Input */}
              {replyingTo === comment.id && (
                <div className="mt-4 flex gap-4">
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
                    <Image
                      src={user?.avatar || '/images/profiles/default.jpg'}
                      alt="Your avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-4 py-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className={`px-4 py-1 rounded-md text-sm font-medium ${
                          replyContent.trim()
                            ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies?.map(reply => (
                <div key={reply.id} className="mt-4 ml-8 flex gap-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
                    <Image
                      src={reply.user.avatar}
                      alt={reply.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{reply.user.name}</span>
                        {reply.user.tier && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(reply.user.tier)}`}>
                            {reply.user.tier}
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          • {formatTimestamp(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-yellow-500">
                        <ThumbsUp className="w-4 h-4" />
                        {reply.likes > 0 && <span>{reply.likes}</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}