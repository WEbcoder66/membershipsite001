// src/app/api/media/delete/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';

const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || '',
  securityKey: process.env.BUNNY_SECURITY_KEY || ''
});

export async function DELETE(req: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, url } = await req.json();

    if (!type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'video') {
      const videoId = url.split('/').pop()?.replace('.mp4', '');
      if (videoId) {
        await bunnyVideo.deleteVideo(videoId);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}