// src/app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get('contentId');
  if (!contentId) {
    return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
  }

  await dbConnect();
  const comments = await Comment.find({ contentId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, comments });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId, text, parentCommentId } = await req.json();
  if (!contentId || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await dbConnect();

  const newComment = await Comment.create({
    contentId,
    text,
    parentCommentId: parentCommentId || null,
    userId: session.user.id,
    username: session.user.name,
    avatar: session.user.image,
    createdAt: new Date()
  });

  return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
}
