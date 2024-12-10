import { NextResponse } from 'next/server';
import { bunnyVideo } from '@/lib/bunnyService';
import { validateAdmin } from '@/lib/auth';

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

    // Parse the request body for the title
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    console.log('Getting upload URL for video:', { title });

    // Get upload URL from Bunny.net
    const { id: videoId, uploadUrl } = await bunnyVideo.getUploadUrl(title);

    // Return just the upload URL and videoId to the client
    return NextResponse.json({ uploadUrl, videoId });

  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}
