import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

// Handle POST requests for creating content
export async function POST(req: Request) {
  try {
    console.log('Content API POST: Starting request');
    await dbConnect();
    console.log('Content API POST: MongoDB connected');
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    console.log('Content API POST: Received data:', data);

    const content = await Content.create({
      type: data.type,
      title: data.title,
      description: data.description || '',
      tier: data.tier || 'basic',
      mediaContent: data.mediaContent || {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Content API POST: Content created:', content);
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Content API POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for retrieving content
export async function GET() {
  try {
    console.log('Content API GET: Starting request');
    await dbConnect();
    
    const contents = await Content.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: contents });
  } catch (error) {
    console.error('Content API GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}