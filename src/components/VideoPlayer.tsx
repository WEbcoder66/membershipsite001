// src/components/VideoPlayer.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Minimize2,
  Settings,
  SkipBack,
  SkipForward,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  title?: string;
  requiredTier: MembershipTier;
  setActiveTab: (tab: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
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
  setActiveTab,
  onPlay,
  onPause,
  onEnded,
  onError
}: VideoPlayerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef(`bunny-player-${videoId}`);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const currentTimeout = hideControlsTimeout.current;
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const hasAccess = useCallback(() => {
    if (!user?.membershipTier) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  useEffect(() => {
    if (!isSDKLoaded || !containerRef.current || playerRef.current) return;

    const loadPlayer = async () => {
      try {
        // Wait for BunnyPlayer to be available
        if (typeof window.BunnyPlayer === 'undefined') {
          console.log('Waiting for BunnyPlayer SDK to load...');
          return; // Exit if BunnyPlayer isn't loaded yet
        }

        console.log('Initializing BunnyPlayer...'); // Debug log
        playerRef.current = new window.BunnyPlayer({
          elementId: playerIdRef.current,
          videoId: videoId,
          libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID,
          displayControls: false,
          autoplay: false,
          preload: 'metadata',
          playbackSpeed: true,
          volume: volume,
          muted: isMuted,
          height: '100%',
          width: '100%',
          title: false,
          enableSharing: false,
        });

        playerRef.current.on('ready', () => {
          console.log('Player ready!'); // Debug log
          setIsLoading(false);
          setDuration(playerRef.current.duration || 0);
        });

        playerRef.current.on('play', () => {
          setIsPlaying(true);
          onPlay?.();
        });

        playerRef.current.on('pause', () => {
          setIsPlaying(false);
          onPause?.();
        });

        playerRef.current.on('timeupdate', (data: any) => {
          setCurrentTime(data.currentTime || 0);
          setBufferedTime(data.buffered || 0);
        });

        playerRef.current.on('ended', () => {
          setIsPlaying(false);
          onEnded?.();
        });

        playerRef.current.on('error', (error: any) => {
          console.error('Player error:', error);
          setError('Failed to load video');
          onError?.(new Error(error.message || 'Video playback error'));
        });

      } catch (error) {
        console.error('Error initializing player:', error);
        setError('Failed to initialize video player');
      }
    };

    // Check for BunnyPlayer SDK every 100ms until it's available
    const checkInterval = setInterval(() => {
      if (typeof window.BunnyPlayer !== 'undefined') {
        clearInterval(checkInterval);
        loadPlayer();
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkInterval);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isSDKLoaded, videoId, volume, isMuted, onPlay, onPause, onEnded, onError]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!hasAccess()) {
      setHasAttemptedPlay(true);
      return;
    }

    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    playerRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    playerRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    playerRef.current.muted = newMuted;
  };

  const skipTime = (seconds: number) => {
    if (!playerRef.current) return;

    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    playerRef.current.currentTime = newTime;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <Script
        src="https://cdn.bunny.net/player/latest/bunny-player.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('BunnyPlayer SDK loaded'); // Debug log
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
        className="relative aspect-video bg-black group"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => setShowControls(false)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {!hasAccess() && hasAttemptedPlay ? (
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
        ) : (
          <>
            <div id={playerIdRef.current} className="w-full h-full" />

            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4 transition-opacity duration-300">
                <div
                  className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-4 relative"
                  onClick={handleSeek}
                >
                  <div
                    className="absolute h-full bg-gray-400 rounded"
                    style={{ width: `${(bufferedTime / duration) * 100}%` }}
                  />
                  <div
                    className="absolute h-full bg-yellow-400 rounded"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-yellow-400"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={() => skipTime(-10)}
                      className="text-white hover:text-yellow-400"
                    >
                      <SkipBack className="w-6 h-6" />
                    </button>

                    <button
                      onClick={() => skipTime(10)}
                      className="text-white hover:text-yellow-400"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>

                    <div className="relative">
                      <button
                        onClick={toggleMute}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        className="text-white hover:text-yellow-400"
                      >
                        {isMuted ? (
                          <VolumeX className="w-6 h-6" />
                        ) : (
                          <Volume2 className="w-6 h-6" />
                        )}
                      </button>

                      {showVolumeSlider && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-black/80 p-2 rounded"
                          onMouseLeave={() => setShowVolumeSlider(false)}
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-24 accent-yellow-400"
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-yellow-400"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-6 h-6" />
                    ) : (
                      <Maximize2 className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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