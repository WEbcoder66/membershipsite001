'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Tags,
  Globe,
  ChartBar,
  ListChecks,
  Minus
} from 'lucide-react';
import { MembershipTier } from '@/lib/types';

interface ContentType {
  id: string;
  type: 'video' | 'poll' | 'gallery' | 'audio';
  scheduledFor: string;
  tier: string;
  status: 'draft' | 'scheduled' | 'published';
}

interface ContentSchedule {
  id: string;
  title: string;
  type: string;
  scheduledFor: string;
  tier: MembershipTier;
  status: 'draft' | 'scheduled' | 'published';
}

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<'create' | 'schedule' | 'analytics'>('create');
  const [contentType, setContentType] = useState<string>('post');
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('basic');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Demo scheduled content
  const [scheduledContent] = useState<ContentSchedule[]>([
    {
      id: '1',
      title: 'Weekly Update Video',
      type: 'video',
      scheduledFor: '2024-03-25T15:00:00Z',
      tier: 'basic',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Premium Tutorial',
      type: 'video',
      scheduledFor: '2024-03-26T15:00:00Z',
      tier: 'premium',
      status: 'scheduled'
    }
  ]);

  // Demo content stats
  const contentStats = {
    posts: {
      total: 156,
      views: 45280,
      engagement: 8.4
    },
    subscribers: {
      basic: 1245,
      premium: 867,
      allAccess: 432
    },
    revenue: {
      monthly: 12458.90,
      annual: 149506.80
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Tabs */}
      <div className="flex gap-4 border-b mb-8">
        {[
          { id: 'create', label: 'Create Content', icon: Plus },
          { id: 'schedule', label: 'Content Schedule', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: ChartBar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'create' | 'schedule' | 'analytics')}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-yellow-400 text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Content Tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-3 gap-8">
          {/* Content Form */}
          <div className="col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Create New Content</h2>
            
            {/* Content Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'post', label: 'Post', icon: FileText },
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
                  { id: 'poll', label: 'Poll', icon: ListChecks }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      contentType === type.id
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-200'
                    }`}
                  >
                    <type.icon className="w-6 h-6" />
                    <span className="font-medium">{type.label}</span>
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

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Content
              </label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                />
                <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500">
                  Select Files
                </button>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publishing Options */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Tier
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

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publishing
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsScheduling(!isScheduling)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      isScheduling
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-200'
                    }`}
                  >
                    {isScheduling ? 'Schedule' : 'Publish Now'}
                  </button>
                </div>
              </div>
            </div>

            {isScheduling && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button className="px-6 py-2 border rounded-lg font-medium hover:bg-gray-50">
                Save Draft
              </button>
              <button className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500">
                {isScheduling ? 'Schedule Content' : 'Publish Now'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Content Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Content Overview</h3>
              <div className="space-y-4">
                {Object.entries(contentStats.posts).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{key}</span>
                    <span className="font-medium">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscriber Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Subscribers</h3>
              <div className="space-y-4">
                {Object.entries(contentStats.subscribers).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{tier}</span>
                    <span className="font-medium">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Revenue</h3>
              <div className="space-y-4">
                {Object.entries(contentStats.revenue).map(([period, amount]) => (
                  <div key={period} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{period}</span>
                    <span className="font-medium">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Content Schedule</h2>
            <div className="space-y-4">
              {scheduledContent.map(content => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded ${
                      content.status === 'published' ? 'bg-green-100' :
                      content.status === 'scheduled' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {content.type === 'video' ? <Video className="w-5 h-5" /> :
                       content.type === 'post' ? <FileText className="w-5 h-5" /> :
                       <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{content.title}</h3>
                      <p className="text-sm text-gray-600">
                        Scheduled for {new Date(content.scheduledFor).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-gray-100">
                      {content.tier}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Total Views', value: '45.2K', trend: '+12%' },
              { label: 'Engagement Rate', value: '8.4%', trend: '+2.1%' },
              { label: 'New Subscribers', value: '342', trend: '+5%' },
              { label: 'Monthly Revenue', value: '$12,458', trend: '+15%' }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-gray-600 text-sm mb-2">{stat.label}</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-sm ${
                    stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-2 gap-6">
            {/* Charts would go here - using placeholders */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Engagement Over Time</h3>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                Chart Placeholder
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Revenue Breakdown</h3>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                Chart Placeholder
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}