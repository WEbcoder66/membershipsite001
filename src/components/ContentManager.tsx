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
  type: 'video' | 'photo' | 'audio' | 'post';
  tier: 'basic' | 'premium' | 'allAccess';
  createdAt: string;
  mediaContent?: {
    video?: { videoId: string; url?: string; thumbnail?: string };
    poll?: { options: Record<string, number>; endDate: string; multipleChoice: boolean };
    photo?: { images: string[] };
    audio?: { url?: string; duration?: string };
  };
}

export default function ContentManager() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'video' | 'photo' | 'audio' | 'post'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll states
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollEnabled, setPollEnabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state
  const [editingContent, setEditingContent] = useState<{
    id: string;
    title: string;
    description: string;
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await handleUpload(files);
    }
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

  async function handleUpload(files: File[]) {
    if (!user?.email) {
      setError('No user email found');
      return;
    }

    // Editing mode does not use this upload function
    if (editingContent) {
      setError('Finish editing before creating new content.');
      return;
    }

    if (contentType === 'post' && pollEnabled && pollOptions.filter(opt => opt.trim()).length < 2) {
      setError('Please provide at least 2 poll options for the poll.');
      return;
    }

    if (!title || !description) {
      setError('Please fill in the title and description.');
      return;
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
          video: { videoId: fileUrl }
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
        if (pollEnabled) {
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
        } else {
          mediaContent = {};
        }
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
        throw new Error(contentData.error || 'Failed to save content metadata');
      }

      alert('Content uploaded and saved successfully!');
      resetForm();
      fetchContent();

      // Add to feed if it's a post or photo
      if (contentType === 'post' || contentType === 'photo') {
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPollOptions(['', '']);
    setPollEnabled(false);
    setError(null);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Handle Edit
  const startEditing = (item: Content) => {
    setEditingContent({
      id: item.id,
      title: item.title,
      description: item.description || ''
    });
    setTitle(item.title);
    setDescription(item.description || '');
    setMembershipTier(item.tier);
    // If has poll, load poll options
    if (item.mediaContent?.poll?.options) {
      const existingOptions = Object.keys(item.mediaContent.poll.options);
      setPollOptions(existingOptions);
      setPollEnabled(true);
    } else {
      setPollEnabled(false);
      setPollOptions(['', '']);
    }
    setContentType(item.type);
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
          title,
          description,
          tier: membershipTier,
          pollOptions: pollEnabled ? pollOptions.filter(opt => opt.trim()) : []
        })
      });
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to update content');
      }
      alert('Content updated successfully!');
      setEditingContent(null);
      resetForm();
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      <h2 className="text-xl font-bold mb-6">{editingContent ? 'Edit Content' : 'Create New Content'}</h2>

      {/* Content Type Selection (Disabled if editing) */}
      {!editingContent && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
          <div className="grid grid-cols-4 gap-4">
            {[
              { type: 'video' as const, icon: Video, label: 'Video' },
              { type: 'photo' as const, icon: ImageIcon, label: 'Photo' },
              { type: 'audio' as const, icon: Music, label: 'Audio' },
              { type: 'post' as const, icon: MessageSquare, label: 'Post' }
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => {
                  setContentType(type);
                  if (type !== 'post') {
                    setPollEnabled(false);
                    setPollOptions(['', '']);
                  }
                }}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  contentType === type
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-200'
                }`}
                disabled={!!editingContent}
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
      )}

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

      {/* Poll Options for Post Type */}
      {contentType === 'post' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Poll Options</label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={pollEnabled}
              onChange={() => setPollEnabled(!pollEnabled)}
            />
            <span className="text-gray-700">Enable Poll for this Post</span>
          </div>

          {pollEnabled && (
            <div className="space-y-4">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-black"
                    placeholder={`Option ${index + 1}`}
                  />
                  {index >= 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPollOption}
                className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
              >
                <PlusCircle className="w-4 h-4" />
                Add Option
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Upload Section (Only if not editing and for video/photo/audio) */}
      {!editingContent && (contentType === 'video' || contentType === 'photo' || contentType === 'audio') && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
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

      {/* Action Buttons */}
      {editingContent ? (
        <button
          onClick={handleUpdateContent}
          disabled={isUploading || !title || !description || (contentType === 'post' && pollEnabled && pollOptions.filter(opt => opt.trim()).length < 2)}
          className="w-full mt-4 bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Updating...' : 'Update Content'}
        </button>
      ) : (
        <button
          onClick={async () => {
            if (contentType === 'post' && pollEnabled) {
              await handleUpload([]);
            } else if (contentType === 'post' && !pollEnabled) {
              await handleUpload([]);
            } else {
              const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [];
              if ((contentType === 'video' || contentType === 'photo' || contentType === 'audio') && files.length === 0) {
                setError('Please select a file if required or ensure all fields are filled.');
              } else {
                await handleUpload(files);
              }
            }
          }}
          disabled={isUploading || !title || !description || (contentType === 'post' && pollEnabled && pollOptions.filter(opt => opt.trim()).length < 2)}
          className="w-full mt-4 bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Content'}
        </button>
      )}

      {/* Existing Content Management */}
      {content.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold">Existing Content</h3>
          {content.map(item => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
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
            </div>
          ))}
        </div>
      )}

      {editingContent && (
        <div className="mt-4">
          <button
            onClick={() => {
              setEditingContent(null);
              resetForm();
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Editing
          </button>
        </div>
      )}
    </div>
  );
}
