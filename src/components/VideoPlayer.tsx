'use client';

import React, { useRef, useEffect } from 'react';
import Plyr from 'plyr';

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier?: string;
  locked: boolean;
}

export default function VideoPlayer({ videoId, thumbnail, locked }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Plyr with full-screen control included
    const player = new Plyr(videoRef.current, {
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

    // Clean up on unmount
    return () => {
      player.destroy();
    };
  }, []);

  // Use a responsive container with a fixed aspect ratio and object-contain
  return (
    <div className="w-full relative">
      <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-contain"
          poster={thumbnail}
          controls={false} // Plyr will handle controls
        >
          <source src={videoId} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
