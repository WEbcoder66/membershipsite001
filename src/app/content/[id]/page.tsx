'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer'; 
import { Content } from '@/lib/types';

export default function ContentPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/content/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setContent(data.data);
        } else {
          throw new Error('Invalid content data');
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchContent();
    }
  }, [params.id]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !content) {
    return <div className="p-4 text-red-600">{error || 'Content not found'}</div>;
  }

  const userTier = session?.user?.membershipTier || 'basic';
  const tiers = ['basic', 'premium', 'allAccess'];
  const userIndex = tiers.indexOf(userTier);
  const contentIndex = tiers.indexOf(content.tier);
  const hasAccess = userIndex >= contentIndex;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{content.title}</h1>

      {content.type === 'video' && content.mediaContent?.video && (
        <div className="relative mb-4">
          {content.isLocked && !hasAccess && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
              <div className="text-center p-6 text-white">
                <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  Requires {content.tier} Access
                </h3>
                <button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                >
                  Upgrade Membership
                </button>
              </div>
            </div>
          )}

          {!content.isLocked || hasAccess ? (
            <VideoPlayer
              videoUrl={content.mediaContent.video.url}
              thumbnail={content.mediaContent.video.thumbnail}
              requiredTier={content.tier}
              locked={content.isLocked && !hasAccess}
            />
          ) : null}
        </div>
      )}

      {!content.isLocked || hasAccess ? (
        <p>{content.description}</p>
      ) : (
        <p className="italic text-gray-600">This content is locked.</p>
      )}
    </div>
  );
}
