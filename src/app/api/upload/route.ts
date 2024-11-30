import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

// Configuration for the route using the new method
export const runtime = 'edge'; // 'nodejs' (default) | 'edge'
export const dynamic = 'force-dynamic'; // 'auto' | 'force-dynamic' | 'error' | 'force-static'

// Initialize BunnyVideoService with environment variables
const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Check if user email is present in the authorization header
    const userEmail = authHeader?.split(' ')[1];
    
    // Check if user is admin
    if (!userEmail || userEmail !== ADMIN_CREDENTIALS.email) {
      console.log('Unauthorized attempt:', userEmail);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 401 }
      );
    }

    // Parse the FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;

    if (!file || !type || !title) {
      console.error('Missing fields:', { file: !!file, type, title });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    let url = '';
    let thumbnailUrl = '';

    if (type === 'video') {
      try {
        console.log('Uploading video to Bunny.net:', { title, size: file.size });
        url = await bunnyVideo.uploadVideo(file, title);
        const videoId = url.split('/').slice(-2)[0];
        thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;
        console.log('Video upload successful:', { url, thumbnailUrl });
      } catch (uploadError) {
        console.error('Bunny.net upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload video to Bunny.net' },
          { status: 500 }
        );
      }
    } else if (type === 'image' || type === 'gallery') {
      // Placeholder for image uploads
      url = '/api/placeholder/800/600';
      thumbnailUrl = '/api/placeholder/400/300';
    } else if (type === 'audio') {
      // Placeholder for audio uploads
      url = '/api/placeholder/audio';
      thumbnailUrl = '/api/placeholder/400/300';
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      thumbnailUrl,
      type,
      title
    });

  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
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