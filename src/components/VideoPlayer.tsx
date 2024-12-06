// src/components/VideoPlayer.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  title?: string;
  requiredTier: MembershipTier;
  setActiveTab: (tab: string) => void;
}

declare global {
  interface Window {
    BunnyPlayer: any;
  }
}

export default function VideoPlayer({
  videoId,
  thumbnail,
  title,
  requiredTier,
  setActiveTab
}: VideoPlayerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef(`bunny-player-${videoId}`);

  const hasAccess = useCallback(() => {
    if (!user?.membershipTier) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  useEffect(() => {
    if (!isSDKLoaded || !containerRef.current || playerRef.current) return;

    const initializePlayer = () => {
      if (typeof window.BunnyPlayer === 'undefined') {
        console.log('Waiting for BunnyPlayer SDK...');
        return;
      }

      try {
        console.log('Initializing BunnyPlayer for video:', videoId);
        playerRef.current = new window.BunnyPlayer({
          elementId: playerIdRef.current,
          videoId: videoId,
          libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
          title: false,
          autoplay: false,
          volume: 100,
          width: '100%',
          height: '100%',
          controls: true,
          enableSharing: false,
          hidePlayerElementsOnPlay: false,
          showQuality: true,
          showSpeed: true,
          preload: true
        });

        playerRef.current.on('ready', () => {
          console.log('Player ready');
          setIsLoading(false);
        });

        playerRef.current.on('error', (error: any) => {
          console.error('Player error:', error);
          setError('Failed to load video');
        });

        playerRef.current.on('play', () => {
          setHasAttemptedPlay(true);
        });

      } catch (error) {
        console.error('Error initializing player:', error);
        setError('Failed to initialize video player');
      }
    };

    const checkInterval = setInterval(() => {
      if (typeof window.BunnyPlayer !== 'undefined') {
        clearInterval(checkInterval);
        initializePlayer();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [isSDKLoaded, videoId]);

  if (!hasAccess() && hasAttemptedPlay) {
    return (
      <div className="relative aspect-video bg-black">
        <img
          src={thumbnail || '/api/placeholder/800/450'}
          alt={title || "Video thumbnail"}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Lock className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-bold mb-2">Premium Content</h3>
          <p className="text-center mb-4 text-gray-300">
            This content is available for {requiredTier} members
          </p>
          <button
            onClick={() => setActiveTab('membership')}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500"
          >
            Upgrade to {requiredTier}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://cdn.bunny.net/player/latest/bunny-player.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('BunnyPlayer SDK loaded');
          setIsSDKLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load BunnyPlayer SDK:', e);
          setError('Failed to load video player');
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
        <div id={playerIdRef.current} className="w-full h-full" />
      </div>

      {title && (
        <div className="mt-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={`px-2 py-0.5 rounded-full ${
              requiredTier === 'premium' ? 'bg-yellow-100 text-yellow-800' : 
              requiredTier === 'allAccess' ? 'bg-yellow-200 text-yellow-900' :
              'bg-gray-100 text-gray-800'
            }`}>
              {requiredTier}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}