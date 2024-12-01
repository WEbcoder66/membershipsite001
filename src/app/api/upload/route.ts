import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const maxDuration = 300; // 5 minutes timeout
export const runtime = 'nodejs';

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
    // First, check if we have the required environment variables
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID || !process.env.BUNNY_CDN_URL) {
      console.error('Missing Bunny.net configuration:', {
        hasApiKey: !!process.env.BUNNY_API_KEY,
        hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
        hasCdnUrl: !!process.env.BUNNY_CDN_URL
      });
      return NextResponse.json(
        { error: 'Bunny.net configuration missing' },
        { status: 500 }
      );
    }

    // Verify admin authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = authHeader.split('Bearer ')[1];
    if (userEmail !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;

    if (!file || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting upload to Bunny.net:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      title,
      type
    });

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
    
    // Extract video ID and create thumbnail URL
    const videoId = videoUrl.split('/').slice(-2)[0];
    const thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;

    console.log('Upload successful:', {
      videoUrl,
      thumbnailUrl,
      videoId
    });

    return NextResponse.json({
      success: true,
      url: videoUrl,
      thumbnailUrl,
      videoId
    });

  } catch (error) {
    console.error('Upload to Bunny.net failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload to Bunny.net',
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