'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File|null>(null);
  const [message, setMessage] = useState<string|null>(null);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/user', { method: 'GET' })
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => {
        setUserData(data);
        setUsername(data.username || '');
      })
      .catch(() => {
        router.push('/auth/signin');
      });
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('username', username);
    if (profilePic) {
      formData.append('profilePic', profilePic);
    }

    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      setMessage('Profile updated successfully!');
    } else {
      setError(data.error || 'Error updating profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      setMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } else {
      setError(data.error || 'Error changing password.');
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {message && <div className="text-green-600 mb-4">{message}</div>}

      <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input 
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setProfilePic(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          className="bg-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-500"
        >
          Update Profile
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-4 mb-8">
        <div>
          <label className="block mb-1 font-medium">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="border w-full px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="border w-full px-3 py-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-500"
        >
          Change Password
        </button>
      </form>

      <div>
        <h2 className="text-xl font-bold mb-2">Purchase History</h2>
        {userData.purchases && userData.purchases.length > 0 ? (
          <ul className="list-disc ml-5">
            {userData.purchases.map((p: string) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p>No purchases yet.</p>
        )}
      </div>
    </div>
  );
}
