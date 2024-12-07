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
  AlertCircle,
  Plus,
  MessageSquare,
  Music,
  X,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Content {
  id: string;
  type: 'video' | 'gallery' | 'audio' | 'poll';
  title: string;
  description: string;
  tier: 'basic' | 'premium' | 'allAccess';
  createdAt: string;
}

export default function ContentManager() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'video' | 'gallery' | 'audio' | 'poll'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    fetchContent();
  }, [user?.email]);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content', {
        headers: {
          'Authorization': `Bearer ${user?.email}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setContent(data.data);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
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
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('membershipTier', membershipTier);
      formData.append('contentType', contentType);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setContent(prev => [...prev, response.data]);
          resetForm();
          alert('Content uploaded successfully!');
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };

      xhr.open('POST', '/api/content/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${user?.email}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.email}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setContent(prev => prev.filter(item => item.id !== contentId));

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete content');
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

      setContent(prev => prev.map(item => 
        item.id === contentId ? { ...item, ...updates } : item
      ));
      
      setEditingContent(null);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUploadProgress(0);
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

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email}`
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
      setContent(prev => [...prev, data.data]);
      resetForm();
      alert('Poll created successfully!');

    } catch (error) {
      console.error('Poll creation error:', error);
      setError('Failed to create poll. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Content</h2>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

      {/* Title & Description */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter content title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter content description..."
          />
        </div>
      </div>

      {/* File Upload or Poll Options */}
      {contentType === 'poll' ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poll Options
          </label>
          {pollOptions.map((option, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updatePollOption(index, e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
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
            className="mt-2 flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Option
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Content
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
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
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mb-4" />
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500"
                >Select File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Membership Tier */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Membership
        </label>
        <select
          value={membershipTier}
          onChange={(e) => setMembershipTier(e.target.value as any)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
        >
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="allAccess">All Access</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        onClick={contentType === 'poll' ? handleCreatePoll : () => fileInputRef.current?.click()}
        disabled={isUploading || !title || !description || 
          (contentType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2)}
        className={`w-full bg-yellow-400 text-black py-3 rounded-lg font-medium 
          hover:bg-yellow-500 transition-colors
          ${(isUploading || !title || !description || 
            (contentType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2)) 
            ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUploading ? 'Uploading...' : contentType === 'poll' ? 'Create Poll' : 'Create Content'}
      </button>

      {/* Content List */}
      {content.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Content</h3>
          <div className="space-y-4">
            {content.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  {editingContent?.id === item.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingContent.title}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          title: e.target.value
                        })}
                        className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-yellow-400"
                      />
                      <textarea
                        value={editingContent.description}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          description: e.target.value
                        })}
                        className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-yellow-400"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(item.id, {
                            title: editingContent.title,
                            description: editingContent.description
                          })}
                          className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingContent(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {item.type}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {item.tier}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingContent(editingContent?.id === item.id ? null : {
                      id: item.id,
                      title: item.title,
                      description: item.description || ''
                    })}
                    className="p-2 text-gray-600 hover:text-yellow-600 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}