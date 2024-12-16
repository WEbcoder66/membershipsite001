'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Lock, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import { Content } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PaymentButton from '@/components/PaymentButton';

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

        console.log('Fetching content with ID:', params.id);
        const response = await fetch(`/api/content/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        if (data.success && data.data) {
          console.log('Content loaded:', data.data);
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Content not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const userTier = session?.user?.membershipTier;
  const hasAccess = userTier 
    ? ['free', 'premium', 'allAccess'].indexOf(userTier) >= 
      ['free', 'premium', 'allAccess'].indexOf(content.tier)
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Content Display */}
          <div className="relative">
            {content.type === 'video' && content.mediaContent?.video && (
              <VideoPlayer
                videoId={content.mediaContent.video.videoId}
                thumbnail={content.mediaContent.video.thumbnail}
                requiredTier={content.tier}
                setActiveTab={() => {}}
                locked={content.isLocked && !hasAccess}
              />
            )}

            {!hasAccess && content.isLocked && content.type !== 'video' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {`This content requires ${content.tier} access`}
                  </h3>
                  <PaymentButton
                    price={content.tier === 'premium' ? 9.99 : 19.99}
                    name={`${content.tier} Membership`}
                    type="subscription"
                    contentId={content.tier}
                    className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Info */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold text-black">{content.title}</h1>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                content.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                content.tier === 'allAccess' ? 'bg-yellow-200 text-yellow-900' :
                'bg-gray-100 text-gray-800'
              }`}>
                {content.tier}
              </span>
            </div>
            
            {!content.isLocked || hasAccess ? (
              <p className="text-gray-600 whitespace-pre-wrap">
                {content.description}
              </p>
            ) : (
              <p className="text-gray-500 italic">Content locked. Upgrade to view.</p>
            )}

            <div className="mt-4 text-sm text-gray-500">
              Posted on {new Date(content.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
