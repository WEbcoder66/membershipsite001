import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Helper function to check video status
const checkVideoStatus = async (videoId: string, apiKey: string) => {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': apiKey
        }
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Error checking video status:', error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    // Validate admin access
    const adminValidation = await validateAdmin(req);
    if (!adminValidation.isValid) {
      return NextResponse.json(
        { error: adminValidation.message || 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get the title from the request body
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Verify environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID || !process.env.BUNNY_CDN_URL) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create video in Bunny.net
    console.log('Creating video in Bunny.net:', { title });
    const response = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`, 
      {
        method: 'POST',
        headers: {
          'AccessKey': process.env.BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          collectionId: process.env.BUNNY_COLLECTION_ID // Optional: if you use collections
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bunny.net error:', errorText);
      throw new Error('Failed to create video');
    }

    const { guid: videoId } = await response.json();
    console.log('Video created with ID:', videoId);

    // Construct URLs
    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`;
    const videoUrl = `${process.env.BUNNY_CDN_URL}/videos/${videoId}/play.mp4`;
    const thumbnailUrl = `${process.env.BUNNY_CDN_URL}/videos/${videoId}/thumbnail.jpg`;

    // Check if pull zone is configured correctly
    try {
      const statusCheck = await checkVideoStatus(videoId, process.env.BUNNY_API_KEY);
      if (statusCheck === null) {
        console.warn('Unable to verify video status, but continuing...');
      }
    } catch (error) {
      console.warn('Error checking initial video status:', error);
    }

    // Return all necessary information
    return NextResponse.json({
      success: true,
      videoId,
      uploadUrl,
      accessKey: process.env.BUNNY_API_KEY,
      videoUrl,
      thumbnailUrl
    });

  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get upload URL',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}