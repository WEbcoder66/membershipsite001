import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feed from '@/models/Feed'; // A Mongoose model for your feed entries
// Adjust to your actual model and logic

export const runtime = 'nodejs'; // If needed

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    await dbConnect();

    // Insert the post into your feed collection or logic
    // For example, if Feed is a model that tracks post IDs:
    await Feed.create({ postId, createdAt: new Date() });

    return NextResponse.json({ success: true, message: 'Post added to feed' });
  } catch (error) {
    console.error('Add to feed error:', error);
    return NextResponse.json({ error: 'Failed to add post to feed' }, { status: 500 });
  }
}
