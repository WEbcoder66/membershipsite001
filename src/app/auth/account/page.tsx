// src/app/auth/account/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!session?.user) {
      // If not signed in, redirect to sign in
      router.push('/auth/signin');
    } else {
      // Set initial username
      setUsername(session.user.name ?? '');
    }
  }, [session, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Updating...');
    try {
      const res = await fetch('/api/user/updateAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update account.');
      setStatusMsg('Account updated successfully! Reloading page...');
      // Reload the page after a short delay to refresh session
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to update account');
    }
  }

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
        
        {statusMsg && (
          <div className="mb-4 p-3 border rounded text-sm">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input 
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New Password (optional)</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              placeholder="Leave blank to keep current password"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500"
          >
            Update Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
