// src/components/VideoPlayer.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

const PlyrPlayer = dynamic(() => import('./PlyrPlayer'), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier?: string;
  setActiveTab?: (tab: string) => void;
  locked: boolean;
}

export default function VideoPlayer({ videoId, thumbnail, locked }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback(() => {
    setError('Failed to load video');
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        // Some browsers might block fullscreen without user gesture
      });
    } else {
      document.exitFullscreen().catch(() => {
        // Handle errors if needed
      });
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={clsx(
        "relative w-full h-full",
        {
          "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4": false
        }
      )}
    >
      {error && (
        <div className="absolute top-4 left-4 right-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {!locked && (
        <div className="relative w-full h-full">
          <PlyrPlayer
            src={videoId}
            poster={thumbnail}
            onError={handleError}
          />
        </div>
      )}

      {!locked && (
        <button 
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 z-50"
        >
          {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}
