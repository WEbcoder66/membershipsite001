'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '@/lib/types';

interface VideoPlayerProps {
  videoId: string;
  url?: string;
  thumbnail?: string;
  title?: string;
  requiredTier: MembershipTier;
  videoDuration?: string;
  setActiveTab: (tab: string) => void;
  autoplay?: boolean;
  startTime?: number;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: Error) => void;
}

interface PlayerError {
  type: string;
  message: string;
  details?: any;
}

export default function VideoPlayer({
  videoId,
  url,
  thumbnail,
  title,
  requiredTier,
  videoDuration,
  setActiveTab,
  autoplay = false,
  startTime = 0,
  loop = false,
  muted = false,
  showControls = true,
  onReady,
  onPlay,
  onPause,
  onEnd,
  onTimeUpdate,
  onError
}: VideoPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const playerRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PlayerError | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 3;
  const retryDelay = 2000;

  // Generate iframe embed URL
  const videoSource = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}`;

  // Debug logging
  useEffect(() => {
    console.log('Video Player Mount:', {
      videoId,
      videoSource,
      libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
    });
  }, [videoId, videoSource]);

  const hasAccess = useCallback(() => {
    if (!user?.membershipTier) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  const retryPlayback = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsRetrying(false);
    
    if (playerRef.current) {
      playerRef.current.src = videoSource;
    }
  }, [videoSource]);

  const handleError = useCallback((errorData: any) => {
    console.error('Video Player Error:', errorData);
    
    const error: PlayerError = {
      type: errorData.type || 'unknown',
      message: errorData.message || 'An error occurred while playing the video',
      details: errorData
    };

    setError(error);
    onError?.(new Error(error.message));

    if (retryCount < maxRetries) {
      setIsRetrying(true);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        retryPlayback();
      }, retryDelay);
    }
  }, [retryCount, maxRetries, retryPlayback, onError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://iframe.mediadelivery.net') return;

      console.log('Received player message:', event.data);

      const { type, data } = event.data;
      switch (type) {
        case 'ready':
          setIsLoading(false);
          if (data.duration) {
            setDuration(data.duration);
          }
          onReady?.();
          break;
        case 'play':
          setIsPlaying(true);
          onPlay?.();
          break;
        case 'pause':
          setIsPlaying(false);
          onPause?.();
          break;
        case 'ended':
          setIsPlaying(false);
          onEnd?.();
          break;
        case 'timeupdate':
          setCurrentTime(data.currentTime);
          onTimeUpdate?.(data.currentTime);
          break;
        case 'error':
          handleError(data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onPlay, onPause, onEnd, onTimeUpdate, handleError]);

  const handleUpgradeClick = () => {
    if (!user) {
      router.push('/auth/signup');
    } else {
      setActiveTab('membership');
    }
  };

  const postMessage = (action: string, data?: any) => {
    if (playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage({ action, data }, '*');
    }
  };

  const togglePlay = () => {
    if (!hasAccess()) {
      setHasAttemptedPlay(true);
      return;
    }
    postMessage(isPlaying ? 'pause' : 'play');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    postMessage('setVolume', { volume: isMuted ? volume : 0 });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    postMessage('setVolume', { volume: newVolume });
  };

  const handleSeek = (time: number) => {
    postMessage('seek', { time });
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!hasAccess() && hasAttemptedPlay) {
    return (
      <div className="relative aspect-video bg-black">
        <img
          src={thumbnail}
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
            onClick={handleUpgradeClick}
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
            {retryCount < maxRetries && (
              <button
                onClick={retryPlayback}
                className="ml-4 flex items-center text-sm text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div ref={containerRef} className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        <iframe
          ref={playerRef}
          src={videoSource}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video player'}
        />

        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4">
            <div
              className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-4"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                handleSeek(percentage * duration);
              }}
            >
              <div
                className="h-full bg-yellow-400 rounded"
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
                  onClick={() => handleSeek(currentTime - 10)}
                  className="text-white hover:text-yellow-400"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handleSeek(currentTime + 10)}
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
                  {`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} / ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-white hover:text-yellow-400">
                  <Settings className="w-6 h-6" />
                </button>

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
          </div>
        )}
      </div>

      {title && (
        <div className="mt-4 space-y-1">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {videoDuration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Duration: {videoDuration}</span>
              {requiredTier !== 'basic' && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                  {requiredTier}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}