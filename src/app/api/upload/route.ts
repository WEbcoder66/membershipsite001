// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';

const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.NEXT_PUBLIC_BUNNY_API_KEY || '',
  libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.NEXT_PUBLIC_BUNNY_CDN_URL || ''
});

export async function POST(req: Request) {
  try {
    // Verify admin authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;

    if (!file || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let url = '';
    let thumbnailUrl = '';

    if (type === 'video') {
      // Upload video to Bunny.net
      url = await bunnyVideo.uploadVideo(file, title);
      thumbnailUrl = `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/thumbnail.jpg`; // Adjust based on your CDN setup
    } else {
      // For other media types, upload to your preferred storage
      // This is a placeholder - implement your preferred storage solution
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
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}