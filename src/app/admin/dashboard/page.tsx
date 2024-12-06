// src/app/admin/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ContentManager from '@/components/ContentManager';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Loader2,
  BarChart
} from 'lucide-react';
import Link from 'next/link';

// Stats data for demo
const statsData = {
  contents: {
    total: 24,
    posts: 12,
    videos: 8,
    galleries: 4
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

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-6 h-6 text-yellow-500" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                View Site
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Content Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium">Content</h3>
            </div>
            <p className="text-2xl font-bold mb-2">{statsData.contents.total}</p>
            <div className="text-sm text-gray-600">
              {statsData.contents.posts} posts<br />
              {statsData.contents.videos} videos<br />
              {statsData.contents.galleries} galleries
            </div>
          </div>

          {/* Member Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium">Members</h3>
            </div>
            <p className="text-2xl font-bold mb-2">{statsData.members.total}</p>
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
              <h3 className="font-medium">Revenue</h3>
            </div>
            <p className="text-2xl font-bold mb-2">
              ${statsData.revenue.monthly.toLocaleString()}
            </p>
            <div className="text-sm text-gray-600">
              ${statsData.revenue.annual.toLocaleString()} yearly<br />
              <span className="text-green-600">↑ {statsData.revenue.growth}% growth</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-48 space-y-1">
            {[
              { id: 'content', label: 'Content', icon: FileText },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg
                  ${activeTab === id
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'content' && <ContentManager />}
            
            {activeTab === 'members' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Member Management</h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Tier</th>
                      <th className="text-left py-2">Joined</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">John Doe</td>
                      <td className="py-2">john@example.com</td>
                      <td className="py-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                          Premium
                        </span>
                      </td>
                      <td className="py-2">Jan 15, 2024</td>
                      <td className="py-2">
                        <button className="text-yellow-600 hover:text-yellow-700">
                          Manage
                        </button>
                      </td>
                    </tr>
                    {/* Add more member rows as needed */}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Site Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Your Super Dope Membership Site"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      defaultValue="Creating High Quality Video & Audio Content"
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}