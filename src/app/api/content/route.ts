import { NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content'; // ensure correct path to your Content model

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // This route expects only metadata (no large files)
    // The video should already be uploaded directly to Bunny.net
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

  } catch (error) {
    console.error('Content API POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
