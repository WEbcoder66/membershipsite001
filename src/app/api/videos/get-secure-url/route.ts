import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Validate admin access
    const adminValidation = await validateAdmin();
    if (!adminValidation.isValid) {
      return NextResponse.json(
        { error: adminValidation.message || 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Validate environment variables
    if (!process.env.BUNNY_CDN_URL || !process.env.BUNNY_SECURITY_KEY) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const { videoId, type } = await req.json();
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' }, 
        { status: 400 }
      );
    }

    // Generate security token
    const timestamp = Math.floor(Date.now() / 1000);
    const expires = timestamp + 3600; // Token valid for 1 hour
    const pathPart = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
    const hashableBase = `${process.env.BUNNY_SECURITY_KEY}${videoId}/${pathPart}${expires}`;

    // Use Web Crypto API for HMAC-SHA256
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
    const token = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Construct secure URL
    const secureUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/${pathPart}?token=${token}&expires=${expires}`;

    return NextResponse.json({
      success: true,
      url: secureUrl,
      expires
    });

  } catch (error) {
    console.error('Error generating secure URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate secure URL',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
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