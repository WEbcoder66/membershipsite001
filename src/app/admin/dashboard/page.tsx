'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ContentManager from '@/components/ContentManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  FileText, 
  Users,
  LogOut,
  Loader2,
  BarChart,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load and auth check
  useEffect(() => {
    if (!session?.user?.isAdmin) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [session, router]);

  // Example stats data (if you have stats)
  const statsData = {
    contents: {
      total: 0,
      videos: 0,
      galleries: 0,
      audio: 0,
      polls: 0
    },
    members: {
      total: 156,
      free: 89,
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
                onClick={() => signOut({ callbackUrl: '/' })}
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
        {/* Stats Overview (Optional) */}
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
              {statsData.members.free} free members<br />
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

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content Manager */}
        <div className="bg-white rounded-lg shadow-lg">
          <ContentManager />
        </div>
      </div>
    </div>
  );
}
