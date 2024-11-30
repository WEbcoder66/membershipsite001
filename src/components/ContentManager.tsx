// src/components/ContentManager.tsx
'use client';
import { hasPermission, ADMIN_CONFIG } from '@/lib/adminConfig';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Content } from '@/lib/types';
import { getAllContent, addContent, deleteContent } from '@/lib/contentService';
import { 
  Upload,
  Image as ImageIcon,
  Video,
  Edit2,
  Trash2,
  AlertCircle,
  Plus,
  Loader2,
  PlusCircle,
  X,
  MessageSquare,
  Music,
  FileText
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ContentManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [contentType, setContentType] = useState<'post' | 'video' | 'gallery' | 'audio' | 'poll'>('post');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedContent, setUploadedContent] = useState<Content[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollEndDate, setPollEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing content on mount
  useEffect(() => {
    try {
      const content = getAllContent();
      setUploadedContent(content);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load existing content');
    }
  }, []);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Cleanup previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(selectedFile);
      setError('');

      // Create preview URL for media files
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setShowPreview(true);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange({ target: { files: [droppedFile] } } as any);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (contentType !== 'post' && contentType !== 'poll' && !file) {
      setError('Please select a file to upload');
      return false;
    }
    if (contentType === 'poll') {
      if (pollOptions.filter(opt => opt.trim()).length < 2) {
        setError('At least 2 poll options are required');
        return false;
      }
      if (!pollEndDate) {
        setError('Poll end date is required');
        return false;
      }
    }
    if (!user?.isAdmin) {
      setError('Admin access required');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setPollOptions(['', '']);
    setPollEndDate('');
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsUploading(true);
    setError('');
    
    try {
      let mediaContent = undefined;

      // Handle media upload if there's a file
      if (file) {
        // Handle media uploads
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', contentType);
        formData.append('title', title);

        try {
          // Use XMLHttpRequest for progress tracking
          const response = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.onprogress = (event) => {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error('Upload failed'));
              }
            };

            xhr.onerror = () => reject(new Error('Upload failed'));

            xhr.open('POST', '/api/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${user?.email}`);
            xhr.send(formData);
          });

          const { url, thumbnailUrl } = response as { url: string; thumbnailUrl: string };

          // Create appropriate media content object based on type
          switch (contentType) {
            case 'video':
              mediaContent = {
                video: {
                  url,
                  thumbnail: thumbnailUrl,
                  duration: '0:00',
                  title,
                  quality: 'HD'
                }
              };
              break;
            case 'gallery':
              mediaContent = {
                gallery: {
                  images: [url],
                  captions: [description]
                }
              };
              break;
            case 'audio':
              mediaContent = {
                audio: {
                  url,
                  duration: '0:00',
                  coverImage: thumbnailUrl
                }
              };
              break;
          }
        } catch (error) {
          throw new Error('Failed to upload media');
        }
      } 
      // Handle poll content
      else if (contentType === 'poll') {
        const pollOptionsObject: Record<string, number> = {};
        pollOptions.forEach(option => {
          if (option.trim()) {
            pollOptionsObject[option.trim()] = 0;
          }
        });
        
        mediaContent = {
          poll: {
            options: pollOptionsObject,
            endDate: pollEndDate,
            multipleChoice: false
          }
        };
      }

      // Create the content object
      const newContent: Content = {
        id: Date.now().toString(),
        type: contentType,
        title: title.trim(),
        description: description.trim(),
        content: contentType === 'post' ? description : undefined,
        mediaContent,
        tier: selectedTier,
        createdAt: new Date().toISOString(),
        isLocked: selectedTier !== 'basic',
        likes: 0,
        comments: 0,
        interactions: {
          reactions: [],
          hasReported: false,
          isSaved: false,
          shares: 0
        },
        tags: [],
        category: contentType.charAt(0).toUpperCase() + contentType.slice(1)
      };

      // Add content to storage
      const updatedContent = addContent(newContent);
      setUploadedContent(updatedContent);

      // Reset form
      resetForm();
      
      alert('Content created successfully!');

    } catch (err) {
      console.error('Content creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      // Delete media file if exists
      const content = uploadedContent.find(c => c.id === contentId);
      if (content?.mediaContent) {
        const response = await fetch('/api/media/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.email}`
          },
          body: JSON.stringify({
            type: content.type,
            url: content.mediaContent.video?.url || 
                 content.mediaContent.gallery?.images[0] ||
                 content.mediaContent.audio?.url
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete media');
        }
      }

      const updatedContent = deleteContent(contentId);
      setUploadedContent(updatedContent);
      alert('Content deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

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
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { type: 'post', icon: FileText, label: 'Post' },
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
                  placeholder="Enter title..."
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
                  placeholder="Enter description..."
                  required
                />
              </div>

              {/* Poll Options */}
              {contentType === 'poll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Options
                  </label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                        placeholder={`Option ${index + 1}`}
                      />
                      {index >= 2 && (<button
                          type="button"
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
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-2 flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Option
                  </button>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poll End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={pollEndDate}
                      onChange={(e) => setPollEndDate(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                      required={contentType === 'poll'}
                    />
                  </div>
                </div>
              )}

              {/* File Upload */}
              {contentType !== 'post' && contentType !== 'poll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Content
                  </label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        contentType === 'video' ? 'video/*' :
                        contentType === 'gallery' ? 'image/*' :
                        contentType === 'audio' ? 'audio/*' : undefined
                      }
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-2" />
                        <p className="text-gray-600">
                          Uploading... {uploadProgress}%
                        </p>
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                          <div 
                            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          {file ? file.name : 'Drag and drop your file here, or click to browse'}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500"
                        >
                          Select File
                        </button>
                      </>
                    )}
                  </div>

                  {/* File Preview */}
                  {showPreview && previewUrl && (
                    <div className="mt-4">
                      {contentType === 'video' ? (
                        <video
                          src={previewUrl}
                          className="max-h-48 mx-auto rounded"
                          controls
                        />
                      ) : contentType === 'gallery' ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded object-contain"
                        />
                      ) : contentType === 'audio' && (
                        <audio
                          src={previewUrl}
                          className="w-full mt-2"
                          controls
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Membership Tier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Tier
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as 'basic' | 'premium' | 'allAccess')}
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
                {isUploading ? 'Creating Content...' : 'Create Content'}
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
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {new Date(content.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => alert('Edit functionality coming soon!')}
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