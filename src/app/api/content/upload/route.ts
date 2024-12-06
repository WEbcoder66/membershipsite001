// src/app/api/content/upload/route.ts
import { NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';
import { bunnyVideo } from '@/lib/bunnyService';
import Content from '@/models/Content';
import dbConnect from '@/lib/mongodb';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Validate admin access
    const validation = await validateAdmin();
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const membershipTier = formData.get('membershipTier') as string;

    if (!file || !title || !description || !membershipTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      // Create video in Bunny.net
      console.log('Creating video:', { title });
      const { guid } = await bunnyVideo.createVideo(title);

      // Upload video data
      console.log('Uploading video to Bunny.net...');
      const arrayBuffer = await file.arrayBuffer();
      await bunnyVideo.uploadVideo(guid, arrayBuffer);
      console.log('Video upload complete');

      // Create content record
      console.log('Creating content record in database...');
      const content = await Content.create({
        type: 'video',
        title,
        description,
        tier: membershipTier,
        mediaContent: {
          video: {
            videoId: guid,
            title,
          }
        },
        isLocked: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        data: content
      });

    } catch (uploadError) {
      console.error('Error during video upload process:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload video content' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload request' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
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