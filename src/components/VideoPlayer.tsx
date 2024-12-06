// src/components/VideoPlayer.tsx
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

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showVolumeSlider: boolean;
  bufferedTime: number;
}

export default function VideoPlayer({
  videoId,
  title,
  thumbnail,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: startTime,
    duration: 0,
    volume: 1,
    isMuted: muted,
    isFullscreen: false,
    showVolumeSlider: false,
    bufferedTime: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  const maxRetries = 3;
  const retryDelay = 2000;

  const hasAccess = useCallback(() => {
    if (!user?.membershipTier) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  const postMessage = useCallback((action: string, data?: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ action, data }, '*');
    }
  }, []);

  const retryPlayback = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsRetrying(true);
    
    if (iframeRef.current) {
      const embedUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}?hideControls=true`;
      iframeRef.current.src = embedUrl;
    }
  }, [videoId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://iframe.mediadelivery.net') return;

      const { event: eventType, value } = event.data;
      switch (eventType) {
        case 'ready':
          setIsLoading(false);
          setPlayerState(prev => ({
            ...prev,
            duration: value?.duration || 0
          }));
          // Set initial volume and muted state
          postMessage('setVolume', { volume: muted ? 0 : playerState.volume });
          if (startTime > 0) {
            postMessage('setCurrentTime', { time: startTime });
          }
          if (autoplay) {
            postMessage('play');
          }
          onReady?.();
          break;

        case 'play':
          setPlayerState(prev => ({ ...prev, isPlaying: true }));
          onPlay?.();
          break;

        case 'pause':
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          onPause?.();
          break;

        case 'ended':
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          if (loop) {
            postMessage('play');
          }
          onEnd?.();
          break;

        case 'timeupdate':
          setPlayerState(prev => ({
            ...prev,
            currentTime: value?.currentTime || 0,
            bufferedTime: value?.buffered || 0
          }));
          onTimeUpdate?.(value?.currentTime || 0);
          break;

        case 'error':
          const errorMessage = value?.message || 'An error occurred during playback';
          setError(errorMessage);
          onError?.(new Error(errorMessage));
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              retryPlayback();
            }, retryDelay);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    onReady, onPlay, onPause, onEnd, onTimeUpdate, onError,
    postMessage, retryPlayback, retryCount, maxRetries,
    autoplay, loop, muted, startTime, playerState.volume
  ]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls visibility handler
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (!hasAccess()) {
      setHasAttemptedPlay(true);
      return;
    }
    postMessage(playerState.isPlaying ? 'pause' : 'play');
  };

  const handleSeek = (time: number) => {
    postMessage('setCurrentTime', { time });
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(playerState.currentTime + seconds, playerState.duration));
    handleSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setPlayerState(prev => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0
    }));
    postMessage('setVolume', { volume: newVolume });
  };

  const toggleMute = () => {
    setPlayerState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
    postMessage(playerState.isMuted ? 'unmute' : 'mute');
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

  // Premium content gate
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
            onClick={() => setActiveTab('membership')}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500"
          >
            Upgrade to {requiredTier}
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}?hideControls=true&autoplay=${autoplay}&loop=${loop}&muted=${muted}`;

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
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
      
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black group"
        onMouseMove={() => {
          if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
          }
          hideControlsTimeout.current = setTimeout(() => {
            if (playerState.isPlaying) {
              // Add class to hide controls
            }
          }, 3000);
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video player'}
        />

        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4 transition-opacity group-hover:opacity-100">
            {/* Progress Bar */}
            <div className="relative">
              <div
                className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-4"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  handleSeek(percentage * playerState.duration);
                }}
              >
                {/* Buffered Progress */}
                <div
                  className="absolute h-full bg-gray-400 rounded"
                  style={{ width: `${(playerState.bufferedTime / playerState.duration) * 100}%` }}
                />
                {/* Playback Progress */}
                <div
                  className="absolute h-full bg-yellow-400 rounded"
                  style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-yellow-400"
                >
                  {playerState.isPlaying ? (
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
                    onMouseEnter={() => setPlayerState(prev => ({ ...prev, showVolumeSlider: true }))}
                    className="text-white hover:text-yellow-400"
                  >
                    {playerState.isMuted ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </button>

                  {playerState.showVolumeSlider && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-black/80 p-2 rounded"
                      onMouseLeave={() => setPlayerState(prev => ({ ...prev, showVolumeSlider: false }))}
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={playerState.isMuted ? 0 : playerState.volume}
                        onChange={handleVolumeChange}
                        className="w-24 accent-yellow-400"
                      />
                    </div>
                  )}
                </div>

                <div className="text-white text-sm">
                  {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-yellow-400"
                >
                  <Settings className="w-6 h-6" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-yellow-400"
                >
                  {playerState.isFullscreen ? (
                    <Minimize2 className="w-6 h-6" />
                  ) : (
                    <Maximize2 className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Settings Menu */}
            {showSettings && (
              <div className="absolute bottom-full mb-4 right-0 bg-black/80 rounded-lg p-4 text-white">
                <div className="space-y-2">
                  <h3 className="font-medium mb-2">Playback Settings</h3>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={loop}
                        onChange={() => postMessage('setLoop', { loop: !loop })}
                      />
                      Loop Video
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Quality:</span>
                      <select 
                        className="bg-transparent border rounded px-2 py-1"
                        onChange={(e) => postMessage('setQuality', { quality: e.target.value })}
                      >
                        <option value="auto">Auto</option>
                        <option value="1080p">1080p</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                        <option value="360p">360p</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Speed:</span>
                      <select 
                        className="bg-transparent border rounded px-2 py-1"
                        onChange={(e) => postMessage('setPlaybackRate', { rate: parseFloat(e.target.value) })}
                      >
                        <option value="0.5">0.5x</option>
                        <option value="1" selected>1x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                <span className={`px-2 py-0.5 rounded-full ${
                  requiredTier === 'premium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-yellow-200 text-yellow-900'
                }`}>
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

