// src/app/admin/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ContentCreator from '@/components/Feed/ContentCreator';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/admin/login');
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={() => router.push('/')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              View Site
            </button>
          </div>
        </div>

        {/* Content Creator */}
        <div className="mb-8">
          <ContentCreator />
        </div>

        {/* Content Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Content Management</h2>
          {/* Add content management features here */}
        </div>
      </div>
    </div>
  );
}