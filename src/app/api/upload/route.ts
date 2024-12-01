import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

async function validateFileUpload(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds limit');
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type');
  }

  return true;
}

export async function POST(req: Request) {
  try {
    // Check environment variables
    if (!process.env.BUNNY_CDN_URL) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify admin authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract and verify admin email
    const userEmail = authHeader.split('Bearer ')[1];
    if (userEmail !== ADMIN_CREDENTIALS.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file
    try {
      await validateFileUpload(file);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid file' },
        { status: 400 }
      );
    }

    // Upload to Bunny.net
    const videoUrl = await bunnyVideo.uploadVideo(file, title);
    
    // Get the video ID from the URL
    const videoId = videoUrl.split('/').slice(-2)[0];
    const thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;

    return NextResponse.json({
      success: true,
      url: videoUrl,
      thumbnailUrl,
      videoId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Bunny.net' },
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