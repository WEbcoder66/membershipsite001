// src/app/api/videos/get-upload-url/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';

const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});

export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const { id, uploadUrl } = await bunnyVideo.getUploadUrl(title);

    return NextResponse.json({ videoId: id, uploadUrl });

  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}