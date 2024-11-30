// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});

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
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID || !process.env.BUNNY_CDN_URL) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get and validate authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' }, 
        { status: 401 }
      );
    }

    // Extract email from Bearer token
    const userEmail = authHeader.split('Bearer ')[1];
    
    // Verify admin credentials
    if (userEmail !== ADMIN_CREDENTIALS.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;

    // Validate form data
    if (!file || !type || !title) {
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

    // Handle video upload
    if (type === 'video') {
      try {
        // Upload to Bunny.net
        const url = await bunnyVideo.uploadVideo(file, title);
        
        // Extract video ID for thumbnail
        const videoId = url.split('/').slice(-2)[0];
        const thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;

        return NextResponse.json({
          success: true,
          url,
          thumbnailUrl,
          type,
          title
        });

      } catch (error) {
        console.error('Video upload error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to upload video' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}