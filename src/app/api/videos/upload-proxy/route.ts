import { NextResponse } from 'next/server';
import { bunnyVideo } from '@/lib/bunnyService';

export const runtime = 'nodejs'; // Ensure Node.js runtime for file handling

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const guid = formData.get('guid') as string;

    if (!file || !guid) {
      return NextResponse.json({ error: 'Missing file or guid' }, { status: 400 });
    }

    // Construct the Bunny.net upload URL
    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${guid}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Bunny.net (server-side, secret key)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.BUNNY_API_KEY!,
        'Content-Type': 'application/octet-stream'
      },
      body: arrayBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bunny upload error:', errorText);
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }

    return NextResponse.json({ success: true, message: 'Video uploaded successfully' });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
