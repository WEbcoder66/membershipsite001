'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Header } from '@/components/Header';  // Use only one import style
import { PaymentButton } from '@/components/PaymentButton';  // Use only one import style

interface Content {
  id: string;
  title: string;
  description: string;
  previewUrl?: string;
  fullVideoUrl: string;
  price: number;
  requiredTier?: string;
}

export default function ContentPage() {
  const { data: session } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const [content, setContent] = useState<Content | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content/${params.id}`);
        const data = await response.json();
        setContent(data);
        
        // Check if user has access
        if (session?.user) {
          const accessResponse = await fetch(`/api/content/${params.id}/access`);
          const { hasAccess } = await accessResponse.json();
          setHasAccess(hasAccess);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchContent();
    }
  }, [params.id, session]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!content) {
    return <div>Content not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative aspect-video">
            {hasAccess ? (
              <video
                src={content.fullVideoUrl}
                controls
                className="w-full h-full"
                poster="/api/placeholder/800/450"
              />
            ) : (
              <>
                {content.previewUrl ? (
                  <video
                    src={content.previewUrl}
                    controls
                    className="w-full h-full"
                    poster="/api/placeholder/800/450"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <Lock className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {content.requiredTier ? 
                        `Available for ${content.requiredTier} members` : 
                        `Purchase for $${content.price}`
                      }
                    </h3>
                    <PaymentButton
                      price={content.price}
                      name={content.title}
                      className="bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-4">{content.title}</h1>
            <p className="text-gray-600">{content.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
}