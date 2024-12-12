'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const PlyrPlayer = dynamic(() => import('./PlyrPlayer'), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  thumbnail?: string;
  requiredTier: string;
  setActiveTab: (tab: string) => void;
  locked: boolean;
}

function VideoPlayer({ videoId, thumbnail, locked }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(() => {
    setError('Failed to load video');
  }, []);

  // If locked, we won't display the video controls anyway, as overlay handled in FeedItem.
  return (
    <div className="relative w-full">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      {!locked && (
        <div className="relative">
          {/* No forced aspect ratio; let Plyr handle it */}
          <PlyrPlayer
            src={videoId}
            poster={thumbnail}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(VideoPlayer);
