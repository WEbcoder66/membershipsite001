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
  currentUserId?: string; // Pass this from parent if needed
}

function formatTimestamp(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  } else {
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }
}

export default function CommentSection({ contentId }: CommentSectionProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  async function fetchComments() {
    const res = await fetch(`/api/comments?contentId=${contentId}`);
    const data = await res.json();
    if (data.success) {
      setComments(data.comments);
    }
  }

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
      fetchComments();
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
      fetchComments();
    }
  }

  async function deleteComment(commentId: string) {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchComments();
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
            className="flex-1 border rounded px-4 py-2 text-black"
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
              <span className="font-medium text-black">{comment.username}</span>
              <span className="text-sm text-gray-500">{formatTimestamp(comment.createdAt)}</span>
            </div>
            <p className="text-gray-800">{comment.text}</p>
            <div className="flex items-center gap-4 mt-2">
              {session?.user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  className="text-sm text-yellow-600 hover:underline"
                >
                  Reply
                </button>
              )}
              {currentUserId === comment.userId && (
                <button
                  onClick={() => deleteComment(comment._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            {replyingTo === comment._id && (
              <div className="mt-2 ml-4">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full border rounded px-4 py-2 mb-2 text-black"
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
                      <span className="font-medium text-black">{reply.username}</span>
                      <span className="text-sm text-gray-500">{formatTimestamp(reply.createdAt)}</span>
                    </div>
                    <p className="text-gray-800">{reply.text}</p>
                    {currentUserId === reply.userId && (
                      <button
                        onClick={() => deleteComment(reply._id)}
                        className="text-sm text-red-600 hover:underline mt-1"
                      >
                        Delete
                      </button>
                    )}
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
