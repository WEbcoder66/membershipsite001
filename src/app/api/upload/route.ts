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
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Check if user email is present in the authorization header
    const userEmail = authHeader?.split(' ')[1];
    
    // Check if user is admin (you might want to add more robust admin validation)
    const isAdmin = userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 401 }
      );
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
      thumbnailUrl = `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/thumbnail.jpg`;
    } else {
      // For other media types, use placeholder for now
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