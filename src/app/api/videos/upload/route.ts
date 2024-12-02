// src/app/api/videos/upload/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';

export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tier = formData.get('tier') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bunnyService = new BunnyVideoService({
      apiKey: process.env.BUNNY_API_KEY!,
      libraryId: process.env.BUNNY_LIBRARY_ID!,
      cdnUrl: process.env.BUNNY_CDN_URL!
    });

    // 1. Create video in Bunny.net
    const { guid } = await bunnyService.createVideo(title);

    // 2. Upload the video
    const arrayBuffer = await file.arrayBuffer();
    await bunnyService.uploadVideo(guid, arrayBuffer);

    return NextResponse.json({
      success: true,
      videoUrl: `${process.env.BUNNY_CDN_URL}/${guid}/play.mp4`,
      thumbnailUrl: `${process.env.BUNNY_CDN_URL}/${guid}/thumbnail.jpg`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}