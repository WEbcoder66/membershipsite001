'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PenTool } from 'lucide-react';

interface Comment {
  _id: string;
  contentId: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  createdAt: string;
  parentCommentId?: string;
  edited?: boolean;
}

interface CommentSectionProps {
  contentId: string;
  currentUserId?: string; 
  onCommentsCountChange?: (count: number) => void;
}

function formatTimestamp(dateString: string, edited?: boolean) {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  let result = '';
  if (diffSec < 60) {
    result = `${diffSec}s ago`;
  } else if (diffSec < 3600) {
    const diffMin = Math.floor(diffSec / 60);
    result = `${diffMin}m ago`;
  } else if (diffSec < 86400) {
    const diffHrs = Math.floor(diffSec / 3600);
    result = `${diffHrs}h ago`;
  } else {
    const diffDays = Math.floor(diffSec / 86400);
    result = `${diffDays}d ago`;
  }

  if (edited) result += ' (edited)';

  return result;
}

export default function CommentSection({ contentId, onCommentsCountChange }: CommentSectionProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/comments?contentId=${contentId}`);
    const data = await res.json();
    if (data.success) {
      setComments(data.comments);
      onCommentsCountChange?.(data.comments.length);
    }
  }, [contentId, onCommentsCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  async function editComment(commentId: string) {
    if (!editText.trim()) return;
    const res = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId, text: editText })
    });
    const data = await res.json();
    if (data.success) {
      setEditingCommentId(null);
      setEditText('');
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
          <div key={comment._id} className="p-4 bg-gray-100 rounded-lg relative">
            {editingCommentId === comment._id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full border rounded px-4 py-2 mb-2 text-black"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditText('');
                    }}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => editComment(comment._id)}
                    className="text-sm text-black bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-black">{comment.username}</span>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(comment.createdAt, comment.edited)}
                  </span>
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
                </div>

                {currentUserId === comment.userId && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        setShowMenuFor(showMenuFor === comment._id ? null : comment._id);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>
                    {showMenuFor === comment._id && (
                      <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded p-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditText(comment.text);
                            setShowMenuFor(null);
                          }}
                          className="block text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            deleteComment(comment._id);
                            setShowMenuFor(null);
                          }}
                          className="block text-sm text-red-600 hover:bg-gray-100 px-2 py-1 w-full text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                      <div key={reply._id} className="bg-white rounded p-3 border relative">
                        {editingCommentId === reply._id ? (
                          <div>
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              className="w-full border rounded px-4 py-2 mb-2 text-black"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditText('');
                                }}
                                className="text-sm text-gray-600 hover:underline"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => editComment(reply._id)}
                                className="text-sm text-black bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-black">{reply.username}</span>
                              <span className="text-sm text-gray-500">
                                {formatTimestamp(reply.createdAt, reply.edited)}
                              </span>
                            </div>
                            <p className="text-gray-800">{reply.text}</p>

                            {currentUserId === reply.userId && (
                              <div className="absolute top-2 right-2">
                                <button
                                  onClick={() => {
                                    setShowMenuFor(showMenuFor === reply._id ? null : reply._id);
                                  }}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <PenTool className="w-4 h-4" />
                                </button>
                                {showMenuFor === reply._id && (
                                  <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded p-2">
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(reply._id);
                                        setEditText(reply.text);
                                        setShowMenuFor(null);
                                      }}
                                      className="block text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 w-full text-left"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        deleteComment(reply._id);
                                        setShowMenuFor(null);
                                      }}
                                      className="block text-sm text-red-600 hover:bg-gray-100 px-2 py-1 w-full text-left"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
