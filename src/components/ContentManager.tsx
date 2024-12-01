'use client';
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await getAllContent();
        setUploadedContent(content);
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
  }, [activeTab]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setMembershipTier('basic');
    setError('');
    setPollOptions(['', '']);
    setPollEndDate('');
    setShowPreview(false);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');

    if (contentType === 'video') {
      setIsUploading(true);
      try {
        // Step 1: Create FormData with required fields
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title || selectedFile.name); // Use file name as fallback
        
        // Step 2: Upload to your API
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.email}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload video');
        }

        const { success, video } = await response.json();

        if (!success || !video) {
          throw new Error('Invalid response from server');
        }

        // Step 3: Save content metadata
        const contentResponse = await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.email}`
          },
          body: JSON.stringify({
            type: 'video',
            title: title || video.title,
            description,
            tier: membershipTier,
            mediaContent: {
              video: {
                url: video.url,
                thumbnail: video.thumbnail,
                title: video.title,
                duration: '0:00' // You can update this if Bunny.net provides duration
              }
            }
          })
        });

        if (!contentResponse.ok) {
          throw new Error('Failed to save content metadata');
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(previewUrl);
        setShowPreview(true);

        setUploadProgress(100);
        alert('Content uploaded successfully!');
        resetForm();

      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload video');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle other content types...
      if (contentType === 'gallery' || contentType === 'audio') {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setShowPreview(true);
      }
    }
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
    if (contentType !== 'poll' && !file) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (contentType === 'poll') {
      try {
        const pollOptionsObject: Record<string, number> = {};
        pollOptions.forEach(option => {
          if (option.trim()) {
            pollOptionsObject[option.trim()] = 0;
          }
        });

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
                options: pollOptionsObject,
                endDate: pollEndDate,
                multipleChoice: false
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create poll');
        }

        resetForm();
        alert('Poll created successfully!');
      } catch (err) {
        console.error('Poll creation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to create poll');
      }
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
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

      await deleteContent(contentId);
      setUploadedContent(prev => prev.filter(item => item.id !== contentId));
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
                      className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
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
                      {index >= 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
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
                    <input type="datetime-local"
                      value={pollEndDate}
                      onChange={(e) => setPollEndDate(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                      required={contentType === 'poll'}
                    />
                  </div>
                </div>
              )}

              {/* File Upload */}
              {contentType !== 'poll' && (
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
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value as 'basic' | 'premium' | 'allAccess')}
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
            <h2 className="text-xl font-bold mb-6">Manage Content</h2>
            {isLoadingContent ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            ) : uploadedContent.length === 0 ? (
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
