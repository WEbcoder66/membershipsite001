import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Validate admin access
    const adminValidation = await validateAdmin(req);
    if (!adminValidation.isValid) {
      return NextResponse.json(
        { error: adminValidation.message || 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { videoId, type } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Construct secure URLs
    const cdnUrl = process.env.BUNNY_CDN_URL;
    if (!cdnUrl) {
      throw new Error('BUNNY_CDN_URL environment variable is not set');
    }

    const path = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
    const url = `${cdnUrl}/${videoId}/${path}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating secure URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate secure URL' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
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