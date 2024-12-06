import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

export const maxDuration = 60; // Reduced timeout to 60 seconds
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

// POST endpoint to upload a video
export async function POST(req: Request) {
  try {
    console.log('Starting video upload process');
    // Verify admin authentication
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

    const formData = await req.formData();
    const file: File | null = formData.get('file') as unknown as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      // Step 1: Create video
      console.log('Creating video with title:', title);
      const { guid } = await bunnyVideo.createVideo(title);
      console.log('Video created with GUID:', guid);

      // Step 2: Upload video data
      console.log('Converting file to ArrayBuffer');
      const arrayBuffer = await file.arrayBuffer();
      console.log('Uploading video data');
      await bunnyVideo.uploadVideo(guid, arrayBuffer);
      console.log('Video upload complete');

      return NextResponse.json({
        success: true,
        video: {
          id: guid,
          title,
          url: `${process.env.BUNNY_CDN_URL}/${guid}/play.mp4`,
          thumbnail: `${process.env.BUNNY_CDN_URL}/${guid}/thumbnail.jpg`
        }
      });
    } catch (err) {
      console.error('Bunny.net operation failed:', err);
      throw err;
    }
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all videos
export async function GET(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify admin authentication
    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '100');

    // Get videos from Bunny.net
    const videoCollection = await bunnyVideo.listVideos(page, perPage);

    // Format the response
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
    // Validate environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify admin authentication
    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    // Get video ID from request body
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Delete video from Bunny.net
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
    // Validate environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify admin authentication
    const headersList = headers();
    try {
      verifyAdmin(headersList);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication error' },
        { status: 401 }
      );
    }

    // Get video details from request body
    const { videoId, title } = await req.json();

    if (!videoId || !title) {
      return NextResponse.json(
        { error: 'Video ID and title are required' },
        { status: 400 }
      );
    }

    // Update video title in Bunny.net
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
export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, DELETE, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}