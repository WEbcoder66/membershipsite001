// src/components/ContentManager.tsx

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Upload,
  Video,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Loader2,
  MessageSquare,
  Music
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'photo' | 'audio' | 'post' | 'poll';
  tier: 'basic' | 'premium' | 'allAccess';
  createdAt: string;
  mediaContent?: Record<string, any>;
}

export default function ContentManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  const [contentType, setContentType] = useState<'video' | 'photo' | 'audio' | 'post' | 'poll'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll states for poll content
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingContent, setEditingContent] = useState<{
    id: string;
    title: string;
    description: string;
    tier: 'basic' | 'premium' | 'allAccess';
  } | null>(null);

  const fetchContent = useCallback(async () => {
    if (!user?.email) return;
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/content', {
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json() as { success: boolean; data: Content[] };
      if (data.success && Array.isArray(data.data)) {
        setContent(data.data.filter((item: Content) => item && item.title));
      } else {
        throw new Error('Invalid content data structure');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchContent();
    }
  }, [user?.email, fetchContent]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPollOptions(['', '']);
    setError(null);
    setContentType('video');
    setMembershipTier('basic');
  };

  async function uploadFileToSpaces(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const fileType = file.type;

    const presignRes = await fetch('/api/videos/get-presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileType })
    });
    const { url } = await presignRes.json();

    if (!presignRes.ok || !url) {
      throw new Error('Failed to get pre-signed URL');
    }

    const uploadRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': fileType },
      body: file
    });

    if (!uploadRes.ok) {
      throw new Error('Upload to Spaces failed');
    }

    const bucketName = 'my-site-uploads'; 
    const region = process.env.NEXT_PUBLIC_DO_REGION || 'nyc3';
    return `https://${bucketName}.${region}.digitaloceanspaces.com/${fileName}`;
  }

  async function handleCreateContent(files: File[]) {
    if (!user?.email) {
      setError('No user email found');
      return;
    }

    if (!title || !description) {
      setError('Please fill in the title and description.');
      return;
    }

    if (contentType === 'poll') {
      // For poll, need at least two options
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError('Please provide at least 2 poll options for the poll.');
        return;
      }
    }

    if ((contentType === 'video' || contentType === 'photo' || contentType === 'audio') && files.length === 0) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      let mediaContent: any = {};

      if (contentType === 'video' || contentType === 'audio') {
        const file = files[0];
        const fileUrl = await uploadFileToSpaces(file);
        mediaContent = {
          [contentType]: { videoId: fileUrl }
        };
      } else if (contentType === 'photo') {
        const imageUrls: string[] = [];
        for (const file of files) {
          const fileUrl = await uploadFileToSpaces(file);
          imageUrls.push(fileUrl);
        }
        mediaContent = {
          photo: {
            images: imageUrls
          }
        };
      } else if (contentType === 'post') {
        // Just text content, no file needed
        mediaContent = {};
      } else if (contentType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim());
        const pollObject = validOptions.reduce((acc: any, opt: string) => {
          acc[opt] = 0;
          return acc;
        }, {});
        mediaContent = {
          poll: {
            options: pollObject,
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            multipleChoice: false
          }
        };
      }

      const contentRes = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email}`
        },
        body: JSON.stringify({
          type: contentType,
          title,
          description,
          tier: membershipTier,
          mediaContent
        })
      });

      const contentData = await contentRes.json();
      if (!contentRes.ok) {
        throw new Error(contentData.error || 'Failed to create content');
      }

      alert('Content uploaded and saved successfully!');
      resetForm();
      fetchContent();

      // If it's post or photo or poll, add to feed
      if (contentType === 'post' || contentType === 'photo' || contentType === 'poll') {
        await handleAddToFeed(contentData.data);
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddToFeed(postData: Content) {
    try {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postData.id })
      });
      if (!response.ok) {
        throw new Error('Failed to add post to feed.');
      }
      console.log('Post added to feed successfully!');
    } catch (err) {
      console.error('Add to feed error:', err);
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/content?id=${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.email}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setContent(prev => prev.filter(item => item.id !== contentId));
      alert('Content deleted successfully!');
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete content');
    }
  };

  const startEditing = (item: Content) => {
    setEditingContent({
      id: item.id,
      title: item.title,
      description: item.description || '',
      tier: item.tier
    });
  };

  const handleUpdateContent = async () => {
    if (!editingContent) return;

    try {
      const response = await fetch(`/api/content?id=${editingContent.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.email}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingContent.title,
          description: editingContent.description,
          tier: editingContent.tier,
          pollOptions: [] // Not editing poll here directly
        })
      });
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to update content');
      }
      alert('Content updated successfully!');
      setEditingContent(null);
      fetchContent();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update content');
    }
  };

  const fileAccept = contentType === 'video' ? 'video/*'
    : contentType === 'photo' ? 'image/*'
    : contentType === 'audio' ? 'audio/*'
    : undefined;
  const fileMultiple = contentType === 'photo';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'create' ? 'border-b-2 border-yellow-400 text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Create Content
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'manage' ? 'border-b-2 border-yellow-400 text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manage Content
        </button>
      </div>

      {activeTab === 'create' && (
        <div>
          <h2 className="text-xl font-bold mb-6">Create New Content</h2>
          {/* Content Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="grid grid-cols-5 gap-4">
              {[
                { type: 'video' as const, icon: Video, label: 'Video' },
                { type: 'photo' as const, icon: ImageIcon, label: 'Photo' },
                { type: 'audio' as const, icon: Music, label: 'Audio' },
                { type: 'post' as const, icon: MessageSquare, label: 'Post' },
                { type: 'poll' as const, icon: MessageSquare, label: 'Poll' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    setContentType(type);
                    setPollOptions(['','']);
                  }}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    contentType === type
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-200'
                  }`}
                  disabled={isUploading}
                >
                  <Icon className={`w-6 h-6 ${
                    contentType === type ? 'text-yellow-500' : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    contentType === type ? 'text-gray-900' : 'text-gray-600'
                  }`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
              placeholder="Enter content title..."
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
              placeholder="Enter content description..."
              required
            />
          </div>

          {/* Membership Tier */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Membership</label>
            <select
              value={membershipTier}
              onChange={(e) => setMembershipTier(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="allAccess">All Access</option>
            </select>
          </div>

          {/* Poll Options if contentType === 'poll' */}
          {contentType === 'poll' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Poll Options</label>
              <div className="space-y-4">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
                      placeholder={`Option ${index + 1}`}
                    />
                    {index >= 2 && (
                      <button
                        onClick={() => {
                          setPollOptions(pollOptions.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* File Upload Section for video/photo/audio */}
          {(contentType === 'video' || contentType === 'photo' || contentType === 'audio') && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={fileAccept}
                multiple={fileMultiple}
              />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-2" />
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your file{fileMultiple ? 's' : ''} here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-yellow-400 px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 text-black"
                  >
                    Select File{fileMultiple ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={async () => {
              const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [];
              await handleCreateContent(files);
            }}
            disabled={isUploading}
            className="w-full mt-4 bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Content'}
          </button>
        </div>
      )}

      {activeTab === 'manage' && (
        <div>
          <h2 className="text-xl font-bold mb-6">Manage Content</h2>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {content.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingContent && editingContent.id === item.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editingContent.title}
                          onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editingContent.description}
                          onChange={(e) => setEditingContent({ ...editingContent, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Membership Tier
                        </label>
                        <select
                          value={editingContent.tier}
                          onChange={(e) => setEditingContent({ ...editingContent, tier: e.target.value as any })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
                        >
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                          <option value="allAccess">All Access</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingContent(null)}
                          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateContent}
                          className="bg-yellow-400 px-4 py-2 rounded-lg font-medium text-black hover:bg-yellow-500"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display content info + actions
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-black">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                            item.tier === 'allAccess' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.tier}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="p-2 hover:bg-gray-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {content.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  No content found. Create some content to get started.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
