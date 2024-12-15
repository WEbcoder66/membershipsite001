'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plyr only on the client to avoid SSR issues
const Plyr = dynamic(() => import('plyr'), { ssr: false });

interface VideoPlayerProps {
  videoUrl: string;  // Make sure this points to a playable video file URL
  thumbnail?: string;
  requiredTier?: string;
  locked: boolean;
}

export default function VideoPlayer({ videoUrl, thumbnail, locked }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!videoRef.current) return;

    import('plyr').then(({ default: PlyrConstructor }) => {
      const player = new PlyrConstructor(videoRef.current, {
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        fullscreen: { enabled: true, fallback: true, iosNative: false },
      });

      return () => {
        player.destroy();
      };
    });
  }, []);

  return (
    <div className="w-full relative">
      {/* 
        A 16:9 aspect ratio container: 
        16 / 9 = 1.777... 
        (9/16)*100% = 56.25% 
      */}
      <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-contain"
          poster={thumbnail}
          controls={false} // Plyr manages controls
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
