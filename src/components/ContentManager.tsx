// src/components/ContentManager.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MembershipTier } from '@/lib/types';
import { createVideo, uploadVideoFile } from '@/lib/videoService';
import { 
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadedContent {
  id: string;
  title: string;
  description: string;
  type: 'post' | 'video' | 'gallery' | 'audio';
  content?: string;
  mediaContent?: {
    video?: {
      url: string;
      thumbnail: string;
      duration: string;
    };
  };
  tier: MembershipTier;
  createdAt: string;
  isLocked: boolean;
  likes: number;
  comments: number;
}

export default function ContentManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [contentType, setContentType] = useState<'post' | 'video' | 'gallery' | 'audio'>('post');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('basic');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');

    try {
      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      if (contentType === 'post') {
        // Handle text post
        const newPost = {
          id: Date.now().toString(),
          title,
          description,
          type: 'post' as const,
          content: description,
          tier: selectedTier,
          createdAt: new Date().toISOString(),
          isLocked: selectedTier !== 'basic',
          likes: 0,
          comments: 0,
        };

        setUploadedContent(prev => [newPost, ...prev]);

      } else if (contentType === 'video' && file) {
        // Handle video upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', file);
        formData.append('tier', selectedTier);

        const { token } = await createVideo(title, description);
        const uploadResult = await uploadVideoFile(token, file);

        const newVideo: UploadedContent = {
          id: uploadResult.id,
          title,
          description,
          type: 'video',
          tier: selectedTier,
          createdAt: new Date().toISOString(),
          isLocked: selectedTier !== 'basic',
          likes: 0,
          comments: 0,
          mediaContent: {
            video: {
              url: uploadResult.video_url,
              thumbnail: uploadResult.thumbnail_url,
              duration: uploadResult.duration || '0:00',
            }
          }
        };

        setUploadedContent(prev => [newVideo, ...prev]);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      alert('Content created successfully!');

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const contentToDelete = uploadedContent.find(c => c.id === contentId);
      
      if (contentToDelete?.type === 'video') {
        // Delete from SproutVideo if it's a video
        const response = await fetch('/api/videos', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.email}`
          },
          body: JSON.stringify({ videoId: contentId })
        });

        if (!response.ok) {
          throw new Error('Failed to delete video');
        }
      }

      // Remove from local state
      setUploadedContent(prev => prev.filter(content => content.id !== contentId));
      alert('Content deleted successfully!');

    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete content');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Tabs */}
      <div className="flex gap-4 bg-white rounded-lg shadow-lg p-4 mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-2 px-4 font-medium rounded-lg transition-colors ${
            activeTab === 'create'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Content
          </div>
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`py-2 px-4 font-medium rounded-lg transition-colors ${
            activeTab === 'manage'
              ? 'bg-yellow-400 text-black'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Manage Content
          </div>
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-lg">
        {activeTab === 'create' && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { type: 'post', icon: FileText, label: 'Post' },
                    { type: 'video', icon: Video, label: 'Video' },
                    { type: 'gallery', icon: ImageIcon, label: 'Gallery' },
                    { type: 'audio', icon: FileText, label: 'Audio' }
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type as any)}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                        contentType === type
                          ? 'border-yellow-400 bg-yellow-50 text-black'
                          : 'border-gray-200 text-gray-600 hover:border-yellow-200'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
                  required
                />
              </div>

              {/* File Upload (for video/gallery/audio) */}
              {contentType !== 'post' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Content
                  </label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept={
                        contentType === 'video' ? 'video/*' :
                        contentType === 'gallery' ? 'image/*' :
                        contentType === 'audio' ? 'audio/*' : undefined
                      }
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-gray-600">Click to upload or drag and drop</span>
                      <span className="text-sm text-gray-500">
                        {file ? file.name : 'No file selected'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Tier
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as MembershipTier)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="allAccess">All Access</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full bg-yellow-400 text-black py-3 rounded-lg font-medium 
                  hover:bg-yellow-500 transition-colors
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? 'Uploading...' : 'Create Content'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Content</h2>
            {uploadedContent.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No content uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {uploadedContent.map(content => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{content.title}</h3>
                      <p className="text-sm text-gray-600">{content.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {content.tier}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {content.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 hover:bg-gray-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}