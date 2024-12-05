import { NextResponse } from 'next/server';
import { headers as getHeaders } from 'next/headers';

// Validate admin middleware
const validateAdmin = async (headersList: Headers) => {
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  // Add your admin validation logic here
  return true;
};

export async function POST(req: Request) {
  try {
    const headersList = getHeaders();
    
    // Validate admin access
    if (!await validateAdmin(headersList)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, videoId } = await req.json();

    const BUNNY_BASE_URL = 'https://video.bunnycdn.com/library';
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiHeaders = {
      'AccessKey': process.env.BUNNY_API_KEY!,
      'Content-Type': 'application/json'
    };

    switch (action) {
      case 'delete': {
        const response = await fetch(
          `${BUNNY_BASE_URL}/${libraryId}/videos/${videoId}`,
          {
            method: 'DELETE',
            headers: apiHeaders
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete video');
        }

        return NextResponse.json({ success: true });
      }

      case 'get-secure-url': {
        if (!process.env.BUNNY_SECURITY_KEY || !process.env.BUNNY_CDN_URL) {
          throw new Error('Missing required environment variables');
        }

        // Generate token using Web Crypto API
        const timestamp = Math.floor(Date.now() / 1000);
        const expires = timestamp + 3600; // 1 hour
        const hashableBase = `${process.env.BUNNY_SECURITY_KEY}${videoId}${expires}`;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(hashableBase);
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(process.env.BUNNY_SECURITY_KEY),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
        const signature = Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const secureUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/play.mp4?token=${signature}&expires=${expires}`;
        
        return NextResponse.json({ url: secureUrl });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Video operation error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}