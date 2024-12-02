import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function POST(req: Request) {
  try {
    console.log('Content API: Starting request');
    
    // Connect to MongoDB
    await dbConnect();
    console.log('Content API: MongoDB connected');

    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log('Content API: Received data:', JSON.stringify(data, null, 2));

    const content = await Content.create({
      type: data.type,
      title: data.title,
      description: data.description,
      tier: data.tier,
      mediaContent: data.mediaContent
    });

    console.log('Content API: Created content:', JSON.stringify(content, null, 2));

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Content API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}