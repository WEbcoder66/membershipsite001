'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Content } from '@/lib/types';
import { 
  Video, 
  Image as ImageIcon, 
  Edit2,
  Trash2,
  AlertCircle,
  Plus,
  Loader2,
  PlusCircle,
  X,
  MessageSquare,
  Music,
  FileText,
  Upload
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VALID_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error';

export default function ContentManager() {
  // State variables
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [contentType, setContentType] = useState<'video' | 'gallery' | 'audio' | 'poll'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedContent, setUploadedContent] = useState<Content[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollEndDate, setPollEndDate] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [editingContent, setEditingContent] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Load content effect
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/api/content', {
          headers: {
            'Authorization': `Bearer ${user?.email}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setUploadedContent(data.data);
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load content');
      } finally {
        setIsLoadingContent(false);
      }
    };

    if (activeTab === 'manage') {
      loadContent();
    }
  }, [activeTab, user?.email]);

  // File validation
  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    let validTypes: string[] = [];
    switch (contentType) {
      case 'video':
        validTypes = VALID_VIDEO_TYPES;
        break;
      case 'gallery':
        validTypes = VALID_IMAGE_TYPES;
        break;
      case 'audio':
        validTypes = VALID_AUDIO_TYPES;
        break;
    }

    if (validTypes.length && !validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Accepted formats: ${validTypes.join(', ')}`);
    }
  };

  // Form reset
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setMembershipTier('basic');
    setError('');
    setPollOptions(['', '']);
    setPollEndDate('');
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File selection handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Delete handler
  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.email}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete content');
      }

      setUploadedContent(prev => prev.filter(content => content.id !== contentId));
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  // Update handler
  const handleUpdate = async (contentId: string, updates: { title?: string; description?: string }) => {
    try {
      setError('');
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.email}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update content');
      }

      const { data } = await response.json();
      
      // Update local content state
      setUploadedContent(prev => 
        prev.map(content => 
          content.id === contentId ? { ...content, ...updates } : content
        )
      );
      
      setEditingContent(null); // Close edit mode
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  };

  // Create content handler
  const handleCreateContent = async () => {
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadStatus('preparing');
    setUploadProgress(10);

    try {
      const formData = new FormData();
      if (file) {
        validateFile(file);
        formData.append('file', file);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('membershipTier', membershipTier);
      formData.append('contentType', contentType);

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.email}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);
      setUploadStatus('success');
      alert('Content uploaded successfully!');
      resetForm();

      // Refresh content list if on manage tab
      if (activeTab === 'manage') {
        const content = await fetch('/api/content').then(res => res.json());
        if (content.success && Array.isArray(content.data)) {
          setUploadedContent(content.data);
        }
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload content');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingContent && activeTab === 'manage') {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-4 rounded-lg font-medium ${
              activeTab === 'create' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Create Content
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-4 rounded-lg font-medium ${
              activeTab === 'manage' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Manage Content
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateContent(); }} className="space-y-6">
            {/* Content Type Selection */}
            <div>
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
                    type="button"
                    onClick={() => setContentType(type as any)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                      contentType === type
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-200'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                required
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
                required
              />
            </div>

            {/* File Upload */}
            {contentType !== 'poll' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full"
                  accept={
                    contentType === 'video' ? 'video/*' :
                    contentType === 'gallery' ? 'image/*' :
                    contentType === 'audio' ? 'audio/*' : undefined
                  }
                />
              </div>
            )}

            {/* Membership Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Membership Tier
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
              type="submit"
              disabled={isUploading}
              className={`w-full bg-yellow-400 text-black py-3 rounded-lg font-medium 
                hover:bg-yellow-500 transition-colors
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? 'Uploading...' : 'Create Content'}
            </button>
          </form>
        ) : (
          // Manage Content View
          <div className="space-y-4">
            {uploadedContent.map((content) => (
              <div key={content.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {editingContent?.id === content.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({
                        ...editingContent,
                        title: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                    />
                    <textarea
                      value={editingContent.description}
                      onChange={(e) => setEditingContent({
                        ...editingContent,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(content.id, {
                          title: editingContent.title,
                          description: editingContent.description
                        })}
                        className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:bg-yellow-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingContent(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{content.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{content.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          content.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                          content.tier === 'allAccess' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {content.tier}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {content.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingContent({
                          id: content.id,
                          title: content.title,
                          description: content.description || ''
                        })}
                        className="p-2 hover:bg-gray-100 rounded text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(content.id)}
                        className="p-2 hover:bg-gray-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {uploadedContent.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                No content found. Create some content to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}