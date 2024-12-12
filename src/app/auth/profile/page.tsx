'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      // If not signed in, redirect to sign in
      router.push('/auth/signin');
    } else {
      // Set initial username
      setUsername(session.user.name ?? '');
      setSelectedTier(session.user.membershipTier ?? 'basic');
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
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to update account');
    }
  };

  const handleTierChange = async (newTier: string) => {
    if (session?.user?.membershipTier === newTier) return;
    setShowProcessing(true);
    // Simulate processing
    setTimeout(async () => {
      const res = await fetch('/api/user/updateTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error updating tier: ' + data.error);
        setShowProcessing(false);
        return;
      }
      setShowProcessing(false);
      alert('Success! Tier updated to ' + newTier);
      window.location.reload();
    }, 2000);
  };

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        
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

        {/* Membership management */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Manage Membership</h2>
          <p className="text-sm text-gray-600 mb-4">Current Tier: {session.user.membershipTier}</p>
          {showProcessing ? (
            <div className="text-center text-gray-700">Processing...</div>
          ) : (
            <div className="space-y-2">
              <button
                disabled={session.user.membershipTier === 'basic'}
                onClick={() => handleTierChange('basic')}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-black rounded"
              >
                Switch to Basic
              </button>
              <button
                disabled={session.user.membershipTier === 'premium'}
                onClick={() => handleTierChange('premium')}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-black rounded"
              >
                Switch to Premium
              </button>
              <button
                disabled={session.user.membershipTier === 'allAccess'}
                onClick={() => handleTierChange('allAccess')}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-black rounded"
              >
                Switch to All-Access
              </button>
            </div>
          )}
        </div>

        {/* Other profile options */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Additional Options</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li><a href="/profile/liked-videos" className="text-yellow-600 hover:text-yellow-700">View Liked Videos</a></li>
            <li><a href="/profile/notifications" className="text-yellow-600 hover:text-yellow-700">Notification Preferences</a></li>
            <li><a href="/profile/privacy" className="text-yellow-600 hover:text-yellow-700">Privacy Controls</a></li>
          </ul>
        </div>

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
