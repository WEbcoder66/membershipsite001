'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plyr only in client-side (browser) environment
const Plyr = dynamic(() => import('plyr'), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier?: string;
  locked: boolean;
}

export default function VideoPlayer({ videoId, thumbnail, locked }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure we are in a browser environment
    if (typeof window === 'undefined') return;
    if (!videoRef.current) return;

    // Importing Plyr this way ensures it loads only on client
    import('plyr').then(({ default: PlyrConstructor }) => {
      const player = new PlyrConstructor(videoRef.current, {
        controls: [
          'play', 
          'progress', 
          'current-time', 
          'mute', 
          'volume', 
          'fullscreen'
        ],
        fullscreen: { enabled: true, fallback: true, iosNative: false },
      });
      
      return () => {
        player.destroy();
      };
    });
  }, []);

  return (
    <div className="w-full relative">
      <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-contain"
          poster={thumbnail}
          controls={false} // Plyr handles controls
        >
          <source src={videoId} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
