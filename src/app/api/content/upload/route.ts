// src/app/api/content/upload/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// SproutVideo API configuration
const SPROUTVIDEO_API_KEY = process.env.SPROUTVIDEO_API_KEY;
const SPROUTVIDEO_API_URL = 'https://api.sproutvideo.com/v1';

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Simple check for admin status based on local storage data
    // In production, you'd want a more secure authentication method
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Create a new video in SproutVideo
    const createVideoResponse = await fetch(`${SPROUTVIDEO_API_URL}/videos`, {
      method: 'POST',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        tags: [membershipTier],
        privacy: 'private',
        domain_restrictions: true,
        signed_urls: true
      }),
    });

    if (!createVideoResponse.ok) {
      throw new Error('Failed to create video');
    }

    const { token } = await createVideoResponse.json();

    // Upload the video file
    const uploadResponse = await fetch(`${SPROUTVIDEO_API_URL}/videos/${token}/upload`, {
      method: 'POST',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video');
    }

    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      videoId: token
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload content' },
      { status: 500 }
    );
  }
}