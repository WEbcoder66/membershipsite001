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

    // Parse request body to get the title
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    console.log('Creating video on Bunny.net:', { title });
    // Create the video in Bunny.net to get its GUID
    const { guid } = await bunnyVideo.createVideo(title);

    // Construct the upload URL using the returned GUID
    // This is the URL you will PUT your video file data to
    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${guid}`;

    return NextResponse.json({ uploadUrl, videoId: guid });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}
