// src/components/CommentSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Comment {
  _id: string;
  contentId: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  createdAt: string;
  parentCommentId?: string;
}

interface CommentSectionProps {
  contentId: string;
}

export default function CommentSection({ contentId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    async function fetchComments() {
      const res = await fetch(`/api/comments?contentId=${contentId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    }

    fetchComments();
  }, [contentId]);

  async function postComment() {
    if (!commentText.trim()) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, text: commentText })
    });
    const data = await res.json();
    if (data.success) {
      setCommentText('');
      // Re-fetch comments after posting
      const res = await fetch(`/api/comments?contentId=${contentId}`);
      const refetchData = await res.json();
      if (refetchData.success) {
        setComments(refetchData.comments);
      }
    }
  }

  async function postReply(parentCommentId: string) {
    if (!replyText.trim()) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, text: replyText, parentCommentId })
    });
    const data = await res.json();
    if (data.success) {
      setReplyText('');
      setReplyingTo(null);
      // Re-fetch comments after posting reply
      const res = await fetch(`/api/comments?contentId=${contentId}`);
      const refetchData = await res.json();
      if (refetchData.success) {
        setComments(refetchData.comments);
      }
    }
  }

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  return (
    <div className="mt-4">
      {session?.user ? (
        <div className="flex gap-2 mb-4">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            onClick={postComment}
            className="bg-yellow-400 px-4 py-2 rounded text-black font-semibold hover:bg-yellow-500"
          >
            Post Comment
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Sign in to comment</p>
      )}

      <div className="space-y-6">
        {topLevelComments.map(comment => (
          <div key={comment._id} className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{comment.username}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-800">{comment.text}</p>
            {session?.user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="text-sm text-yellow-600 hover:underline mt-2"
              >
                Reply
              </button>
            )}

            {replyingTo === comment._id && (
              <div className="mt-2 ml-4">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full border rounded px-4 py-2 mb-2"
                  placeholder="Write a reply..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => postReply(comment._id)}
                    className="text-sm text-black bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            )}

            {getReplies(comment._id).length > 0 && (
              <div className="mt-4 ml-6 space-y-4">
                {getReplies(comment._id).map(reply => (
                  <div key={reply._id} className="bg-white rounded p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{reply.username}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-800">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
