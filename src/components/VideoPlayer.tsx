import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerIdRef = useRef(`bunny-player-${videoId}`);

  // Check if user has access to this tier
  const checkAccess = useCallback(() => {
    if (!user?.membershipTier) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier];
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  // Clean up function to stop video playback
  const cleanupPlayer = () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  useEffect(() => {
    setHasAccess(checkAccess());

    if (!hasAccess || !containerRef.current) return;

    const initializePlayer = () => {
      try {
        const iframeSrc = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}?autoplay=false`;
        
        const iframe = document.createElement('iframe');
        iframe.src = iframeSrc;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.border = 'none';
        
        iframe.onload = () => {
          setIsLoading(false);
        };

        iframe.onerror = () => {
          setError('Failed to load video');
          setIsLoading(false);
        };
        
        const container = document.getElementById(playerIdRef.current);
        if (container) {
          container.innerHTML = '';
          container.appendChild(iframe);
        }

        // Listen for play events
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'play') {
            setHasAttemptedPlay(true);
          }
        };

        window.addEventListener('message', handleMessage);

        return () => {
          window.removeEventListener('message', handleMessage);
        };

      } catch (error) {
        console.error('Error initializing player:', error);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    const cleanup = initializePlayer();
    
    return () => {
      cleanupPlayer();
      cleanup?.();
    };
  }, [videoId, hasAccess, checkAccess]);

  // Render locked content view
  if (!hasAccess) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Blurred Thumbnail */}
        <div className="absolute inset-0">
          <img
            src={thumbnail || '/api/placeholder/800/450'}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-black/50" /> {/* Dark overlay */}
        </div>

        {/* Lock Icon and Text */}
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
      
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden"
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