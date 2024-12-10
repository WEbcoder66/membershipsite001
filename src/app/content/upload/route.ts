// src/app/api/content/upload/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { validateAdmin } from '@/lib/auth';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Validate admin access
    const validation = await validateAdmin();
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the content type header
    const contentType = req.headers.get('content-type') || '';

    // Handle different content types
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const title = formData.get('title') as string;
      const file = formData.get('file') as File;

      if (!file || !title) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Create video in Bunny.net
      const { guid } = await bunnyVideo.createVideo(title);

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Upload to Bunny.net
      await bunnyVideo.uploadVideo(guid, arrayBuffer);

      // Get the secure URLs
      const videoUrl = await bunnyVideo.getVideoUrl(guid, 'video');
      const thumbnailUrl = await bunnyVideo.getVideoUrl(guid, 'thumbnail');

      return NextResponse.json({
        success: true,
        video: {
          id: guid,
          title,
          url: videoUrl,
          thumbnail: thumbnailUrl
        }
      });
    }

    // Handle direct uploads or other content types
    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 415 }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

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