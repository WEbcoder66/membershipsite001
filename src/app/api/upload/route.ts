// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

// Initialize BunnyVideoService with non-public env variables
const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});

export async function POST(req: Request) {
  try {
    // Log environment variables (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Environment check:', {
        hasApiKey: !!process.env.BUNNY_API_KEY,
        hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
        hasCdnUrl: !!process.env.BUNNY_CDN_URL,
        libraryId: process.env.BUNNY_LIBRARY_ID,
        cdnUrl: process.env.BUNNY_CDN_URL
      });
    }

    // Check configuration before proceeding
    if (!process.env.BUNNY_API_KEY) {
      console.error('Missing BUNNY_API_KEY');
      return NextResponse.json(
        { error: 'Missing Bunny.net API Key' },
        { status: 500 }
      );
    }

    if (!process.env.BUNNY_LIBRARY_ID) {
      console.error('Missing BUNNY_LIBRARY_ID');
      return NextResponse.json(
        { error: 'Missing Bunny.net Library ID' },
        { status: 500 }
      );
    }

    if (!process.env.BUNNY_CDN_URL) {
      console.error('Missing BUNNY_CDN_URL');
      return NextResponse.json(
        { error: 'Missing Bunny.net CDN URL' },
        { status: 500 }
      );
    }

    // Get and validate authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header');
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

    // Parse form data
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

    let url = '';
    let thumbnailUrl = '';

    if (type === 'video') {
      try {
        url = await bunnyVideo.uploadVideo(file, title);
        const videoId = url.split('/').slice(-2)[0];
        thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;
      } catch (error) {
        console.error('Video upload error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to upload video' },
          { status: 500 }
        );
      }
    } else {
      // Handle other file types (placeholders for now)
      url = '/api/placeholder/800/600';
      thumbnailUrl = '/api/placeholder/400/300';
    }

    return NextResponse.json({
      success: true,
      url,
      thumbnailUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}