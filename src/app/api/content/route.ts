// src/app/api/content/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function GET() {
  try {
    await dbConnect();
    const contents = await Content.find({}).sort({ createdAt: -1 });
    return NextResponse.json(contents);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    const data = await req.json();
    // Validate required fields
    if (!data.title || !data.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Create content in MongoDB
    const content = await Content.create(data);
    return NextResponse.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create content record' },
      { status: 500 }
    );
  }
}