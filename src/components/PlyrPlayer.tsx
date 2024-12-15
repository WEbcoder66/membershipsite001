// src/components/PlyrPlayer.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import 'plyr/dist/plyr.css';

interface PlyrPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
}

export default function PlyrPlayer({ src, poster, onError }: PlyrPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const initializePlyr = async () => {
      try {
        const Plyr = (await import('plyr')).default;
        
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new Plyr(videoRef.current, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'settings',
            'fullscreen'
          ],
          settings: ['quality', 'speed'],
          ratio: 'auto',
          fullscreen: {
            enabled: true,
            fallback: true,
            iosNative: true
          },
          resetOnEnd: true,
          quality: {
            default: 1080,
            options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240]
          }
        });

        const video = videoRef.current;

        // Handle video metadata loaded to set proper aspect ratio
        const handleMetadata = () => {
          if (!video) return;
          
          const ratio = video.videoWidth / video.videoHeight;
          const wrapper = video.closest('.plyr__video-embed');
          
          if (wrapper) {
            if (ratio < 1) {
              wrapper.classList.add('vertical-video');
              wrapper.classList.remove('horizontal-video');
            } else {
              wrapper.classList.add('horizontal-video');
              wrapper.classList.remove('vertical-video');
            }
          }
        };

        const handleError = (e: Event) => {
          console.error('Video playback error:', e);
          onError?.();
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('error', handleError);

        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeEventListener('error', handleError);
        };

      } catch (error) {
        console.error('Error initializing Plyr:', error);
        onError?.();
      }
    };

    initializePlyr();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      className="plyr-react plyr"
      poster={poster}
      playsInline
      preload="metadata"
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}