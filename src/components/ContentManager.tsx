// src/components/ContentManager.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  ChartBar,
  ListChecks
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';

interface UploadedContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'image' | 'post' | 'audio';
  url: string;
  tier: MembershipTier;
  createdAt: string;
  status: 'published' | 'draft' | 'scheduled';
  scheduledFor?: string;
}

export default function ContentManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [contentType, setContentType] = useState<'video' | 'image' | 'post' | 'audio'>('post');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('basic');
  const [file, setFile] = useState<File | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
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
      // Here you would implement your actual upload logic
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tier', selectedTier);
      formData.append('type', contentType);
      if (isScheduled && scheduleDate) {
        formData.append('scheduledFor', scheduleDate);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add to uploaded content (in real app, would come from API response)
      const newContent: UploadedContent = {
        id: Date.now().toString(),
        title,
        description,
        type: contentType,
        url: URL.createObjectURL(file!),
        tier: selectedTier,
        createdAt: new Date().toISOString(),
        status: isScheduled ? 'scheduled' : 'published',
        ...(isScheduled && { scheduledFor: scheduleDate })
      };

      setUploadedContent(prev => [newContent, ...prev]);

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setScheduleDate('');
      setIsScheduled(false);

      alert('Content uploaded successfully!');
    } catch (err) {
      setError('Failed to upload content. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        // Here you would make an API call to delete the content
        setUploadedContent(prev => prev.filter(content => content.id !== contentId));
        alert('Content deleted successfully!');
      } catch (err) {
        setError('Failed to delete content. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'upload'
              ? 'border-b-2 border-yellow-400 text-black'
              : 'text-gray-600'
          }`}
        >
          Upload Content
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'manage'
              ? 'border-b-2 border-yellow-400 text-black'
              : 'text-gray-600'
          }`}
        >
          Manage Content
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {activeTab === 'upload' && (
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
                { type: 'image', icon: ImageIcon, label: 'Image' },
                { type: 'audio', icon: FileText, label: 'Audio' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContentType(type as any)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                    contentType === type
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
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
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Content
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required
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

          {/* Publishing Options */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membership Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as MembershipTier)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="allAccess">All Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publishing
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                  />
                  Schedule for later
                </label>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full bg-yellow-400 text-black py-3 rounded-lg font-medium 
              hover:bg-yellow-500 transition-colors
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload Content'}
          </button>
        </form>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          {uploadedContent.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No content uploaded yet.</p>
          ) : (
            uploadedContent.map(content => (
              <div
                key={content.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{content.title}</h3>
                  <p className="text-sm text-gray-600">{content.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {content.tier}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {content.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {/* Add edit functionality */}}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="p-2 hover:bg-gray-100 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}