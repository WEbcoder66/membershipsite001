// src/app/api/content/route.ts
import { NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';
import mongoose from 'mongoose';

interface ILeanContent {
  _id: mongoose.Types.ObjectId;
  type: 'video' | 'photo' | 'audio' | 'post' | 'poll';
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
      return NextResponse.json({ error: 'Missing content ID' }, { status:400 });
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

export async function PATCH(req: Request) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, tier, pollOptions } = await req.json();
    const updateData: any = { updatedAt: new Date() };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tier) updateData.tier = tier;

    // If pollOptions are provided and we're dealing with a poll or want to update poll
    if (Array.isArray(pollOptions)) {
      const validOptions = pollOptions.filter((opt: string) => opt.trim());
      if (validOptions.length >= 2) {
        const pollObject = validOptions.reduce((acc: any, opt: string) => {
          acc[opt] = 0;
          return acc;
        }, {});
        updateData['mediaContent.poll'] = {
          options: pollObject,
          endDate: new Date(Date.now() + 7*24*60*60*1000),
          multipleChoice: false
        };
      } else {
        // If no valid poll or less than 2 options, remove poll
        updateData['mediaContent.poll'] = undefined;
      }
    }

    const updated = await Content.findByIdAndUpdate(contentId, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id: updated._id.toString(), ...updated.toObject() } }, { status: 200 });
  } catch (error: any) {
    console.error('Content PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update content', details: error?.message }, { status: 500 });
  }
}
