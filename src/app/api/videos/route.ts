// src/app/api/videos/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createVideo, uploadVideoFile } from '@/lib/videoService';

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Check for admin authentication
    if (!authHeader || !authHeader.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get the form data
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
    const tier = formData.get('tier') as string;

    // Validate inputs
    if (!file || !title || !description || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create video in SproutVideo
    const createResult = await createVideo(title, description);
    
    if (!createResult.token) {
      throw new Error('Failed to get video token');
    }

    // Upload the video file
    const uploadResult = await uploadVideoFile(createResult.token, file);

    // Return the response
    return NextResponse.json({
      success: true,
      video: {
        id: uploadResult.id,
        title,
        description,
        tier,
        videoUrl: uploadResult.video_url,
        thumbnailUrl: uploadResult.thumbnail_url,
        duration: uploadResult.duration,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all videos
export async function GET(req: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get the videos from SproutVideo
    const response = await fetch('https://api.sproutvideo.com/v1/videos', {
      headers: {
        'SproutVideo-Api-Key': process.env.SPROUTVIDEO_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const videos = await response.json();
    return NextResponse.json({ videos });

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
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
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

    // Delete from SproutVideo
    const response = await fetch(`https://api.sproutvideo.com/v1/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'SproutVideo-Api-Key': process.env.SPROUTVIDEO_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete video');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}