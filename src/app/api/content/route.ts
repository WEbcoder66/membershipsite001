import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

// Helper function to verify admin authentication
const verifyAdmin = (headersList: Headers) => {
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  const userEmail = authHeader.split('Bearer ')[1];
  return userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
};

export async function GET() {
  try {
    await dbConnect();
    const contents = await Content.find({}).sort({ createdAt: -1 });
    return NextResponse.json(contents);
  } catch (error) {
    console.error('Content fetch error:', error);
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
    
    // Verify admin authentication
    const headersList = headers();
    if (!verifyAdmin(headersList)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    if (!data.title || !data.type || !data.tier) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, and tier are required' },
        { status: 400 }
      );
    }

    // Create content in MongoDB
    const content = await Content.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
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