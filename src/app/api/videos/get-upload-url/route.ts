import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bunnyVideo } from '@/lib/bunnyService';
import { validateAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Validate admin access
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get title from request body
    const { title } = await req.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get upload URL from Bunny.net
    console.log('Getting upload URL for video:', { title });
    const { id: videoId, uploadUrl } = await bunnyVideo.getUploadUrl(title);
    
    // Return the upload URL and other necessary info
    return NextResponse.json({
      uploadUrl,
      videoId,
      accessKey: process.env.BUNNY_API_KEY
    });

  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}