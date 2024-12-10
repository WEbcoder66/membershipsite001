// src/app/admin/dashboard/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ContentManager from '@/components/ContentManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Loader2,
  BarChart,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'gallery' | 'audio' | 'poll';
  tier: 'basic' | 'premium' | 'allAccess';
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'members' | 'settings'>('content');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managedContent, setManagedContent] = useState<Content[]>([]);
  const [isManaging, setIsManaging] = useState(false);

  // Initial load and auth check
  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  // Fetch content using useCallback
  const fetchContent = useCallback(async () => {
    try {
      setError(null);
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
        setManagedContent(data.data);
      } else {
        throw new Error('Invalid content data structure');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content. Please try again.');
    }
  }, [user?.email]);

  useEffect(() => {
    if (isManaging) {
      fetchContent();
    }
  }, [isManaging, fetchContent]);

  // Handle content deletion (use query param instead of body)
  const handleDeleteContent = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/content?id=${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.email}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      await fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      setError('Failed to delete content. Please try again.');
    }
  };

  // Stats data (demo)
  const statsData = {
    contents: {
      total: managedContent.length || 0,
      videos: managedContent.filter(c => c.type === 'video').length || 0,
      galleries: managedContent.filter(c => c.type === 'gallery').length || 0,
      audio: managedContent.filter(c => c.type === 'audio').length || 0,
      polls: managedContent.filter(c => c.type === 'poll').length || 0
    },
    members: {
      total: 156,
      basic: 89,
      premium: 45,
      allAccess: 22
    },
    revenue: {
      monthly: 2435.50,
      annual: 29226.00,
      growth: 12.5
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-6 h-6 text-yellow-500" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                View Site
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Content Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium text-gray-900">Content</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statsData.contents.total}
            </p>
            <div className="text-sm text-gray-600">
              {statsData.contents.videos} videos<br />
              {statsData.contents.galleries} galleries<br />
              {statsData.contents.audio} audio<br />
              {statsData.contents.polls} polls
            </div>
          </div>

          {/* Member Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium text-gray-900">Members</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statsData.members.total}
            </p>
            <div className="text-sm text-gray-600">
              {statsData.members.basic} basic members<br />
              {statsData.members.premium} premium members<br />
              {statsData.members.allAccess} all-access members
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium text-gray-900">Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${statsData.revenue.monthly.toFixed(2)}
            </p>
            <div className="text-sm text-gray-600">
              ${statsData.revenue.annual.toFixed(2)} yearly<br />
              <span className="text-green-600">↑ {statsData.revenue.growth}% growth</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b">
            {[
              { id: 'content', label: 'Content', icon: FileText },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium ${
                  activeTab === id
                    ? 'border-yellow-400 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-lg">
          {activeTab === 'content' && (
            <>
              {/* Content Management Header */}
              <div className="border-b px-6 py-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsManaging(false)}
                    className={`py-2 px-4 rounded-lg font-medium ${
                      !isManaging ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Create Content
                  </button>
                  <button
                    onClick={() => setIsManaging(true)}
                    className={`py-2 px-4 rounded-lg font-medium ${
                      isManaging ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Manage Content
                  </button>
                </div>
              </div>

              {/* Content Management */}
              {isManaging ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {managedContent.map((content) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{content.title}</h3>
                          {content.description && (
                            <p className="text-sm text-gray-600 mt-1">{content.description}</p>
                          )}
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
                            onClick={() => {/* Implement edit functionality */}}
                            className="p-2 hover:bg-gray-100 rounded text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="p-2 hover:bg-gray-100 rounded text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {managedContent.length === 0 && (
                      <div className="text-center py-8 text-gray-600">
                        No content found. Create some content to get started.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <ContentManager />
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Member Management</h2>
              <div className="text-gray-600">Member management coming soon...</div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Site Settings</h2>
              <div className="text-gray-600">Settings panel coming soon...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
