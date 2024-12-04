'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getBunnyVideoUrl } from '@/lib/videoUtils';
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
  url: string;
  thumbnail?: string;
  title?: string;
  requiredTier: MembershipTier;
  duration?: string;
  setActiveTab: (tab: string) => void;
  videoId?: string;
}

export default function VideoPlayer({
  url,
  thumbnail,
  title,
  requiredTier,
  duration,
  setActiveTab,
  videoId
}: VideoPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>(url);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(thumbnail || '');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const MAX_RETRIES = 3;

  const hasAccess = useCallback(() => {
    if (!user) return false;
    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    return userTierLevel >= requiredLevel;
  }, [user, requiredTier]);

  // Generate secured URLs when videoId changes
  useEffect(() => {
    async function generateUrls() {
      if (videoId) {
        try {
          const [newVideoUrl, newThumbnailUrl] = await Promise.all([
            getBunnyVideoUrl(videoId, 'video'),
            getBunnyVideoUrl(videoId, 'thumbnail')
          ]);
          setVideoUrl(newVideoUrl);
          setThumbnailUrl(newThumbnailUrl);
        } catch (error) {
          console.error('Failed to generate video URLs:', error);
          setError('Failed to generate video URLs');
        }
      }
    }
    generateUrls();
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      loadedmetadata: () => {
        setVideoDuration(video.duration);
        setIsLoading(false);
        setError(null);
      },
      playing: () => {
        setIsLoading(false);
        setIsPlaying(true);
        setError(null);
      },
      pause: () => setIsPlaying(false),
      waiting: () => setIsLoading(true),
      timeupdate: () => setCurrentTime(video.currentTime),
      ended: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        video.currentTime = 0;
      },
      error: async (e: Event) => {
        const videoError = (e.target as HTMLVideoElement).error;
        console.error('Video Error:', videoError);

        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Regenerate URLs on retry
          if (videoId) {
            const [newVideoUrl, newThumbnailUrl] = await Promise.all([
              getBunnyVideoUrl(videoId, 'video'),
              getBunnyVideoUrl(videoId, 'thumbnail')
            ]);
            setVideoUrl(newVideoUrl);
            setThumbnailUrl(newThumbnailUrl);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          video.load();
        } else {
          setIsError(true);
          setIsLoading(false);
          setError(videoError?.message || 'Failed to play video');
          setIsPlaying(false);
        }
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        video.removeEventListener(event, handler);
      });
    };
  }, [retryCount, videoId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const hideControls = () => setShowControls(false);
      controlsTimeoutRef.current = setTimeout(hideControls, 2000);
      return () => clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying, showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  const handleUpgradeClick = () => {
    if (!user) {
      router.push('/auth/signup');
    } else {
      setActiveTab('membership');
    }
  };

  const togglePlay = async () => {
    if (!hasAccess()) {
      setHasAttemptedPlay(true);
      return;
    }

    if (!videoRef.current) return;

    try {
      setError(null);
      if (isPlaying) {
        await videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setError('Failed to play video. Please try again.');
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !hasAccess()) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * videoDuration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current || !hasAccess()) return;
    videoRef.current.currentTime += seconds;
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
      console.error('Error handling fullscreen:', error);
      setError('Failed to toggle fullscreen mode');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!hasAccess() && hasAttemptedPlay) {
    return (
      <div className="relative aspect-video bg-black">
        <img
          src={thumbnailUrl}
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          onClick={togglePlay}
          poster={thumbnailUrl}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
        >
          <source 
            src={videoUrl}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        {isLoading && !isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-center text-white">
              <p className="mb-4">Failed to load video</p>
              <button
                onClick={async () => {
                  setIsError(false);
                  setRetryCount(0);
                  if (videoRef.current) {
                    if (videoId) {
                      const [newVideoUrl, newThumbnailUrl] = await Promise.all([
                        getBunnyVideoUrl(videoId, 'video'),
                        getBunnyVideoUrl(videoId, 'thumbnail')
                      ]);
                      setVideoUrl(newVideoUrl);
                      setThumbnailUrl(newThumbnailUrl);
                    }
                    videoRef.current.load();
                  }
                }}
                className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!isPlaying && !isLoading && !isError && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Play className="w-12 h-12 text-white" />
          </button>
        )}

        {showControls && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4">
            <div 
              className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-4"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-yellow-400 rounded"
                style={{ width: `${(currentTime / videoDuration) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-yellow-400">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
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
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
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
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 accent-yellow-400"
                      />
                    </div>
                  )}
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
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
    </div>
  );
}