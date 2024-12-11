import { NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';
import mongoose from 'mongoose';

interface ILeanContent {
  _id: mongoose.Types.ObjectId;
  type: 'video' | 'photo' | 'audio' | 'post'; // Updated to include 'photo' and remove 'gallery'
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tier: 'basic' | 'premium' | 'allAccess';
  isLocked: boolean;
  mediaContent?: Record<string, any>;
  likes: number;
  comments: number;
  views: number;
}

export async function GET() {
  try {
    await dbConnect();
    const rawResult = await Content.find({})
      .sort({ createdAt: -1 })
      .lean();

    const allContent = rawResult as unknown as ILeanContent[];

    const formattedContent = allContent.map(item => ({
      ...item,
      id: item._id.toString()
    }));

    return NextResponse.json({ success: true, data: formattedContent }, { status: 200 });
  } catch (error: any) {
    console.error('Content API GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch content', details: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Validate admin access
    const validation = await validateAdmin();
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { type, title, description, tier, mediaContent } = await req.json();

    if (!type || !title || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newContent = await Content.create({
      type,
      title,
      description,
      tier,
      mediaContent,
      isLocked: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newContent._id.toString(),
        ...newContent.toObject()
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Content API POST Error:', error);
    return NextResponse.json({ error: 'Failed to create content', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('id');

    if (!contentId) {
      return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
    }

    // Validate admin access
    const validation = await validateAdmin();
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const deleted = await Content.findByIdAndDelete(contentId);

    if (!deleted) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete content', details: error?.message }, { status: 500 });
  }
}
