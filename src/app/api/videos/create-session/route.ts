import { NextResponse } from 'next/server';
import { bunnyVideo } from '@/lib/bunnyService';
import { validateAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Optionally validate admin if you only want admins to upload
    const validation = await validateAdmin();
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create a new video entry on Bunny.net
    const { guid } = await bunnyVideo.createVideo(title);

    // Return the guid so the client can use it when uploading
    return NextResponse.json({ success: true, guid });
  } catch (error) {
    console.error('Error creating video session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
