// src/app/api/videos/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

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