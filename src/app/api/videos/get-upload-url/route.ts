import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

// Route Segment Config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Verify admin authentication
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

// POST endpoint to get upload URL
export async function POST(req: NextRequest) {
  try {
    console.log('Starting upload URL request process');
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking environment variables:', {
      hasApiKey: !!process.env.BUNNY_API_KEY,
      hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
      hasCdnUrl: !!process.env.BUNNY_CDN_URL
    });

    // Get title from request body
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    try {
      // Create video in Bunny.net to get upload URL
      console.log('Creating video with title:', title);
      const { guid } = await bunnyVideo.createVideo(title);
      console.log('Video created with GUID:', guid);

      // Return upload URL and necessary credentials
      return NextResponse.json({
        success: true,
        videoId: guid,
        uploadUrl: `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${guid}`,
        accessKey: process.env.BUNNY_API_KEY,
        videoUrl: `${process.env.BUNNY_CDN_URL}/${guid}/play.mp4`,
        thumbnailUrl: `${process.env.BUNNY_CDN_URL}/${guid}/thumbnail.jpg`
      });

    } catch (err) {
      console.error('Bunny.net operation failed:', err);
      throw err;
    }
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all videos
export async function GET(req: Request) {
  try {
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '100');

    const videoCollection = await bunnyVideo.listVideos(page, perPage);

    const formattedVideos = videoCollection.items.map(video => ({
      id: video.guid,
      title: video.title,
      url: `${process.env.BUNNY_CDN_URL}/${video.guid}/play.mp4`,
      thumbnail: `${process.env.BUNNY_CDN_URL}/${video.guid}/thumbnail.jpg`,
      dateUploaded: video.dateUploaded,
      views: video.views,
      status: video.status,
      size: video.storageSize
    }));

    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      totalItems: videoCollection.totalItems,
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a video
export async function DELETE(req: Request) {
  try {
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    await bunnyVideo.deleteVideo(videoId);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update video details
export async function PUT(req: Request) {
  try {
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    const { videoId, title } = await req.json();

    if (!videoId || !title) {
      return NextResponse.json(
        { error: 'Video ID and title are required' },
        { status: 400 }
      );
    }

    await bunnyVideo.updateVideoTitle(videoId, title);

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully'
    });

  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}