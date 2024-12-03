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
  FileText,
  XCircle,
  RefreshCcw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_RETRIES = 3;
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VALID_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error';

const checkVideoStatus = async (videoId: string, accessKey: string) => {
  try {
    const response = await fetch(`https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/videos/${videoId}`, {
      headers: {
        'AccessKey': accessKey
      }
    });
    const data = await response.json();
    return data.status; // 4 means encoded and ready
  } catch (error) {
    console.error('Error checking video status:', error);
    return null;
  }
};

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
  const [retryCount, setRetryCount] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
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
    setRetryCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle retry
  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    if (file) {
      await handleFileSelection(file);
    }
  };
  
  // File selection handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 1) {
      setUploadQueue(prev => [...prev, ...droppedFiles.slice(1)]);
    }
    if (droppedFiles[0]) {
      handleFileSelection(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 1) {
      setUploadQueue(prev => [...prev, ...selectedFiles.slice(1)]);
    }
    if (selectedFiles[0]) {
      handleFileSelection(selectedFiles[0]);
    }
  };

  // Main file handling function
  const handleFileSelection = async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');
    setUploadStatus('preparing');
    
    try {
      validateFile(selectedFile);
      
      if (!title) {
        throw new Error('Please enter a title before uploading');
      }

      setIsUploading(true);
      setUploadProgress(10);

      // Get upload URL from our API
      const urlResponse = await fetch('/api/videos/get-upload-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.email}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, accessKey, videoUrl, thumbnailUrl, videoId } = await urlResponse.json();

      // Upload to Bunny.net
      setUploadStatus('uploading');
      setUploadProgress(30);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': accessKey,
          'Content-Type': 'application/octet-stream'
        },
        body: selectedFile
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to Bunny.net');
      }

      setUploadProgress(70);
      setUploadStatus('processing');

      // Wait for video to be encoded
      let encodingStatus;
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
        encodingStatus = await checkVideoStatus(videoId, accessKey);
        if (encodingStatus === null) {
          throw new Error('Failed to check video status');
        }
      } while (encodingStatus !== 4); // 4 means encoded and ready

      setUploadProgress(90);

      // Save content metadata
      const contentData = {
        type: 'video',
        title,
        description,
        tier: membershipTier,
        mediaContent: {
          video: {
            url: videoUrl,
            thumbnail: thumbnailUrl,
            videoId,
            title
          }
        }
      };

      const contentResponse = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email}`
        },
        body: JSON.stringify(contentData)
      });

      if (!contentResponse.ok) {
        throw new Error('Failed to save content metadata');
      }

      setUploadProgress(100);
      setUploadStatus('success');
      alert('Content uploaded successfully!');
      resetForm();

      // Refresh content list if on manage tab
      if (activeTab === 'manage') {
        const content = await getAllContent();
        setUploadedContent(content);
      }

      // Process next item in queue if exists
      if (uploadQueue.length > 0) {
        const nextFile = uploadQueue[0];
        setUploadQueue(prev => prev.slice(1));
        await handleFileSelection(nextFile);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload content');
      setUploadStatus('error');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Delete content handler
  const handleDelete = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(contentId);
        setUploadedContent(prev => prev.filter(content => content.id !== contentId));
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete content');
      }
    }
  };

  // Poll handling
  const handleCreatePoll = async () => {
    if (!title || !description || pollOptions.filter(opt => opt.trim()).length < 2) {
      setError('Please fill in all required fields and provide at least 2 poll options');
      return;
    }

    try {
      const pollOptionsObject: Record<string, number> = {};
      pollOptions.forEach(option => {
        if (option.trim()) {
          pollOptionsObject[option.trim()] = 0;
        }
      });

      const contentData = {
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
      };

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email}`
        },
        body: JSON.stringify(contentData)
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      resetForm();
      alert('Poll created successfully!');

      if (activeTab === 'manage') {
        const content = await getAllContent();
        setUploadedContent(content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contentType === 'poll') {
      await handleCreatePoll();
    } else if (file) {
      await handleFileSelection(file);
    }
  };

  // Upload Status Component
  const renderUploadStatus = () => {
    if (uploadStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Upload failed</span>
          <button
            onClick={handleRetry}
            className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
            disabled={retryCount >= MAX_RETRIES}
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }
    if (isUploading) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">
              {uploadStatus === 'preparing' ? 'Preparing upload...' :
               uploadStatus === 'uploading' ? 'Uploading to Bunny.net...' :
               uploadStatus === 'processing' ? 'Processing video...' : ''}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Queue Status Component
  const renderQueueStatus = () => {
    if (uploadQueue.length > 0) {
      return (
        <div className="text-sm text-gray-600 mt-2">
          {uploadQueue.length} file(s) queued for upload
        </div>
      );
    }
    return null;
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
        {activeTab === 'create' ? (
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
                  placeholder="Enter description..."
                  required
                />
              </div>

              {/* File Upload Section */}
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
                        contentType === 'video' ? 'video/mp4,video/webm,video/quicktime' :
                        contentType === 'gallery' ? 'image/jpeg,image/png,image/webp' :
                        contentType === 'audio' ? 'audio/mpeg,audio/wav,audio/mp3' : undefined
                      }
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {isUploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
                        {renderUploadStatus()}
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
                  {renderQueueStatus()}
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
                {isUploading ? 'Creating Content...' : 'Create Content'}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Content</h2>
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