// src/components/Feed/ContentCreator.tsx
'use client';
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload,
  Video,
  Image as ImageIcon,
  FileText,
  PlusCircle,
  X,
  Loader2,
  MessageSquare
} from 'lucide-react';

export default function ContentCreator() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'video' | 'image' | 'poll' | 'audio'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | 'allAccess'>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Only render for admin users
  if (!user?.isAdmin) {
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('membershipTier', membershipTier);

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${user?.email}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Clear form after successful upload
      setTitle('');
      setDescription('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Content uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
      alert('Please fill in all required fields and provide at least 2 poll options');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/content/create-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${user?.email}`
        },
        body: JSON.stringify({
          title,
          description,
          membershipTier,
          options: pollOptions.filter(opt => opt.trim()),
          type: 'poll'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      // Clear form
      setTitle('');
      setDescription('');
      setPollOptions(['', '']);
      alert('Poll created successfully!');

    } catch (error) {
      console.error('Poll creation error:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Create New Content</h2>

      {/* Content Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Type
        </label>
        <div className="grid grid-cols-4 gap-4">
          {[
            { type: 'video' as const, icon: Video, label: 'Video' },
            { type: 'image' as const, icon: ImageIcon, label: 'Image' },
            { type: 'poll' as const, icon: MessageSquare, label: 'Poll' },
            { type: 'audio' as const, icon: FileText, label: 'Audio' }
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setContentType(type)}
              className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                contentType === type
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 hover:border-yellow-200'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Membership Tier */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Membership
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

      {/* Poll Options */}
      {contentType === 'poll' && (
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
      )}

      {/* File Upload */}
      {contentType !== 'poll' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Content
          </label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={contentType === 'video' ? 'video/*' : 
                      contentType === 'image' ? 'image/*' : 
                      contentType === 'audio' ? 'audio/*' : '*/*'}
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-2" />
                <p className="text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500"
                >
                  Select File
                </button>
              </>
            )}
          </div>
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
  );
}