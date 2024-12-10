// src/components/ContentManager.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
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
  type: 'video' | 'gallery' | 'audio' | 'poll';
  tier: 'basic' | 'premium' | 'allAccess';
  createdAt: string;
  mediaContent?: {
    video?: {
      videoId: string;
      url?: string;
      thumbnail?: string;
    };
  };
}

export default function ContentManager() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'video' | 'gallery' | 'audio' | 'poll'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress] = useState(0); // We won't track exact progress here for simplicity
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.email) {
      fetchContent();
    }
  }, [user?.email]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.email) {
        throw new Error('No user email found');
      }

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
  };

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
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDirectUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectUpload(file);
    }
  };

  // New function to handle direct upload to Bunny.net
  const handleDirectUpload = async (file: File) => {
    if (contentType === 'poll') {
      setError('Use the "Create Poll" button for polls, no file upload required.');
      return;
    }

    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      if (!user?.email) {
        throw new Error('No user email found');
      }

      // Step 1: Get upload URL and videoId from your server
      const getUrlRes = await fetch('/api/videos/get-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({ title })
      });

      if (!getUrlRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, videoId } = await getUrlRes.json();

      // Step 2: Upload the file directly to Bunny.net
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': process.env.NEXT_PUBLIC_BUNNY_API_KEY as string,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Direct upload to Bunny.net failed');
      }

      // Step 3: After successful upload, send metadata to /api/content
      const contentResponse = await fetch('/api/content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          type: contentType,
          title,
          description,
          tier: membershipTier,
          mediaContent: {
            video: { videoId }
          }
        })
      });

      if (!contentResponse.ok) {
        throw new Error('Failed to save content metadata');
      }

      const data = await contentResponse.json();
      if (data.success && data.data) {
        setContent(prev => [...prev, data.data]);
        resetForm();
        alert('Content uploaded successfully!');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPollOptions(['', '']);
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

  const handleCreatePoll = async () => {
    if (!title || !description || pollOptions.filter(opt => opt.trim()).length < 2) {
      setError('Please fill in all required fields and provide at least 2 poll options');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      if (!user?.email) {
        throw new Error('No user email found');
      }

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          type: 'poll',
          title,
          description,
          tier: membershipTier,
          mediaContent: {
            poll: {
              options: pollOptions.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              multipleChoice: false
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setContent(prev => [...prev, data.data]);
        resetForm();
        alert('Poll created successfully!');
      }
    } catch (error) {
      console.error('Poll creation error:', error);
      setError('Failed to create poll. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (contentId: string, updates: { title?: string; description?: string }) => {
    try {
      setError(null);
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.email}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      // Assuming the response returns the updated content
      setContent(prev => prev.map(item => 
        item.id === contentId ? { ...item, ...updates } : item
      ));
      
      setEditingContent(null);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  };

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
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      {!error && (
        <>
          <h2 className="text-xl font-bold mb-6">Create New Content</h2>

          {/* Content Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-4 gap-4">
              {[
                { type: 'video', icon: Video, label: 'Video' },
                { type: 'gallery', icon: ImageIcon, label: 'Gallery' },
                { type: 'audio', icon: Music, label: 'Audio' },
                { type: 'poll', icon: MessageSquare, label: 'Poll' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setContentType(type as any)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    contentType === type
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-200'
                  }`}
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

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Membership
              </label>
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

            {/* Content Upload or Poll Options */}
            {contentType === 'poll' ? (
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
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 ${
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
                  accept={
                    contentType === 'video' ? 'video/*' :
                    contentType === 'gallery' ? 'image/*' :
                    contentType === 'audio' ? 'audio/*' : undefined
                  }
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
                      Drag and drop your file here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-yellow-400 px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 text-black"
                    >
                      Select File
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={contentType === 'poll' ? handleCreatePoll : () => fileInputRef.current?.click()}
              disabled={isUploading || !title || !description || (contentType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2)}
              className={`w-full bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUploading ? 'Uploading...' : contentType === 'poll' ? 'Create Poll' : 'Upload Content'}
            </button>
          </div>

          {/* Content List */}
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
                        onClick={() => setEditingContent({
                          id: item.id,
                          title: item.title,
                          description: item.description || ''
                        })}
                        className="p-2 hover:bg-gray-100 rounded text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Delete button handled in admin panel */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
