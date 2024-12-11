'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';
import dynamic from 'next/dynamic';

const PlyrPlayer = dynamic(() => import('./PlyrPlayer'), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier: MembershipTier;
  setActiveTab: (tab: string) => void;
}

export default function VideoPlayer({
  videoId,
  thumbnail,
  requiredTier,
  setActiveTab
}: VideoPlayerProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user?.membershipTier) return;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier];
    const requiredLevel = tierLevels[requiredTier];
    setHasAccess(userTierLevel >= requiredLevel);
  }, [user, requiredTier]);

  if (!hasAccess) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={thumbnail || '/api/placeholder/800/450'}
            alt="Video thumbnail"
            className="w-full h-full object-cover filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 p-6">
          <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-center">
            {requiredTier} Content
          </h3>
          <p className="text-center mb-6 text-lg text-gray-200">
            Subscribe to {requiredTier} to unlock this video
          </p>
          <button
            onClick={() => setActiveTab('membership')}
            className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            Join to Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <PlyrPlayer
          src={videoId}
          poster={thumbnail}
          onError={() => setError('Failed to load video')}
        />
      </div>
    </div>
  );
}
