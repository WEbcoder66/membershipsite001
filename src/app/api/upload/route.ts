import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BunnyVideoService } from '@/lib/bunnyService';
import { ADMIN_CREDENTIALS } from '@/lib/adminConfig';

// Initialize BunnyVideoService
const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});

export async function POST(req: Request) {
  try {
    // Get and validate authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' }, 
        { status: 401 }
      );
    }
    
    // Extract email from Bearer token
    const userEmail = authHeader.split('Bearer ')[1];
    
    // Debug log for authentication
    console.log('Auth check:', {
      receivedEmail: userEmail,
      expectedEmail: ADMIN_CREDENTIALS.email,
      isMatch: userEmail === ADMIN_CREDENTIALS.email
    });

    // Verify admin credentials
    if (userEmail !== ADMIN_CREDENTIALS.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 401 }
      );
    }

    // Check Bunny.net configuration
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID || !process.env.BUNNY_CDN_URL) {
      console.error('Missing Bunny.net configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;

    // Validate form data
    if (!file || !type || !title) {
      console.error('Missing required fields:', { 
        hasFile: !!file, 
        type, 
        title 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    let url = '';
    let thumbnailUrl = '';

    // Handle different content types
    switch (type) {
      case 'video':
        try {
          console.log('Processing video upload:', { 
            title, 
            size: file.size 
          });
          url = await bunnyVideo.uploadVideo(file, title);
          
          // Extract video ID and create thumbnail URL
          const videoId = url.split('/').slice(-2)[0];
          thumbnailUrl = `${process.env.BUNNY_CDN_URL}/${videoId}/thumbnail.jpg`;
          
          console.log('Video upload successful:', { 
            url, 
            thumbnailUrl 
          });
        } catch (error) {
          console.error('Bunny.net upload error:', error);
          return NextResponse.json(
            { error: 'Failed to upload video to Bunny.net' },
            { status: 500 }
          );
        }
        break;

      case 'image':
      case 'gallery':
        try {
          // Convert File to Buffer for processing
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // TODO: Implement image storage
          // For now, using placeholders
          url = '/api/placeholder/800/600';
          thumbnailUrl = '/api/placeholder/400/300';
          
          console.log('Image processed:', { url, thumbnailUrl });
        } catch (error) {
          console.error('Image processing error:', error);
          return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
          );
        }
        break;

      case 'audio':
        try {
          // Convert File to Buffer for processing
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // TODO: Implement audio storage
          // For now, using placeholders
          url = '/api/placeholder/audio';
          thumbnailUrl = '/api/placeholder/400/300';
          
          console.log('Audio processed:', { url });
        } catch (error) {
          console.error('Audio processing error:', error);
          return NextResponse.json(
            { error: 'Failed to process audio' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported content type' },
          { status: 400 }
        );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url,
      thumbnailUrl,
      type,
      title
    });

  } catch (error) {
    // Log the error and return safe response
    console.error('Upload route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  // Handle CORS preflight requests
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