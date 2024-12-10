import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

export const maxDuration = 60; // Reduced timeout to 60 seconds
export const dynamic = 'force-dynamic';

// Helper function to generate Bunny.net signed URLs
const generateBunnySignedUrl = (videoPath: string, expiresInSeconds: number) => {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const hash = crypto
    .createHmac('sha256', process.env.BUNNY_SECURITY_KEY!)
    .update(`${videoPath}${expires}`)
    .digest('hex');
  return `${videoPath}?token=${hash}&expires=${expires}`;
};

// Verify admin authentication (if needed for future endpoints)
const verifyAdmin = (headersList: Headers) => {
  const authHeader = headersList.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  const userEmail = authHeader.split('Bearer ')[1];
  if (userEmail !== ADMIN_CREDENTIALS.email) {
    throw new Error('Unauthorized - Admin access required');
  }
};

// GET endpoint to fetch all videos with signed URLs
export async function GET(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID || !process.env.BUNNY_CDN_URL || !process.env.BUNNY_SECURITY_KEY) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Simulate user authentication and membership check
    // In a real implementation, you should verify the user's membership status
    const user = { isAuthenticated: true, membershipTier: 'premium' }; 

    if (!user.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '100');

    // Get videos from Bunny.net
    const videoCollection = await bunnyVideo.listVideos(page, perPage);

    // Format the response with secure URLs
    const formattedVideos = videoCollection.items.map((video) => ({
      id: video.guid,
      title: video.title,
      secureUrl: `${process.env.BUNNY_CDN_URL}${generateBunnySignedUrl(
        `/${video.guid}/play.mp4`,
        3600
      )}`, // URL valid for 1 hour
      thumbnail: `${process.env.BUNNY_CDN_URL}/${video.guid}/thumbnail.jpg`,
      dateUploaded: video.dateUploaded,
      views: video.views,
      status: video.status,
      size: video.storageSize,
      isLocked: false, // Update based on membership logic if needed
    }));

    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      totalItems: videoCollection.totalItems,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// OPTIONS endpoint for CORS
export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
