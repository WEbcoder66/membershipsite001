// src/components/ContentManager.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
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
  ChartBar
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';

interface UploadedContent {
  id: string;
  title: string;
  description: string;
  type: 'post' | 'video' | 'gallery' | 'audio';
  url: string;
  tier: MembershipTier;
  createdAt: string;
}

export default function ContentManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [contentType, setContentType] = useState<'post' | 'video' | 'gallery' | 'audio'>('post');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('basic');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);

  // Check if user is admin, if not redirect to login
  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/admin/login');
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && contentType !== 'post') {
      setError('Please upload a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Here you would implement your actual file upload logic
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newContent: UploadedContent = {
        id: Date.now().toString(),
        title,
        description,
        type: contentType,
        url: file ? URL.createObjectURL(file) : '',
        tier: selectedTier,
        createdAt: new Date().toISOString()
      };

      setUploadedContent(prev => [newContent, ...prev]);
      
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      alert('Content uploaded successfully!');
    } catch (err) {
      setError('Failed to upload content. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      // Here you would make an API call to delete the content
      setUploadedContent(prev => prev.filter(content => content.id !== contentId));
      alert('Content deleted successfully!');
    } catch (err) {
      setError('Failed to delete content');
      console.error(err);
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

    return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-lg">
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

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Create Content Form */}
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

              {/* File Upload */}
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
                {isUploading ? 'Uploading...' : 'Upload Content'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Content */}
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
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {content.tier}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 text-red-600 hover:bg-gray-100 rounded"
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