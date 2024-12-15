// src/components/PlyrPlayer.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import Plyr from 'plyr';

interface PlyrPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
}

export default function PlyrPlayer({ src, poster, onError }: PlyrPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !videoRef.current) return;

    const video = videoRef.current;
    const player = new Plyr(video, {
      controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen']
    });

    const handleError = () => {
      onError?.();
    };

    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('error', handleError);
      player.destroy();
    };
  }, [onError]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full"
      poster={poster}
      controls={false}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}