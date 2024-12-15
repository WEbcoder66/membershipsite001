// src/components/VideoPlayer.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

const PlyrPlayer = dynamic(() => import('./PlyrPlayer'), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier?: string;
  setActiveTab?: (tab: string) => void;
  locked: boolean;
}

export default function VideoPlayer({ 
  videoId, 
  thumbnail, 
  requiredTier,
  setActiveTab,
  locked 
}: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const handleError = useCallback(() => {
    setError('Failed to load video');
  }, []);

  // Handle Digital Ocean Spaces URL
  const getVideoUrl = (id: string | null | undefined) => {
    if (!id) return '';
    
    try {
      // If id is already a full URL, return it
      if (typeof id === 'string' && id.includes('http')) {
        return id;
      }
      // Otherwise construct the URL (adjust this based on your DO setup)
      return `${process.env.NEXT_PUBLIC_DO_SPACES_URL}/${id}`;
    } catch (error) {
      console.error('Error processing video URL:', error);
      return '';
    }
  };

  if (!videoId) {
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg"
    >
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative w-full">
        {locked ? (
          <div className="relative w-full aspect-video bg-black">
            {thumbnail && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${thumbnail})` }}
              />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {`This content requires ${requiredTier} access`}
                </h3>
                {!session?.user ? (
                  <button
                    onClick={() => window.location.href = '/auth/signin'}
                    className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
                  >
                    Sign In to Watch
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab?.('membership')}
                    className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
                  >
                    Upgrade Membership
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="plyr__video-embed">
            <PlyrPlayer
              src={getVideoUrl(videoId)}
              poster={thumbnail}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  );
}