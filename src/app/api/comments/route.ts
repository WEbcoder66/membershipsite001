import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Content from '@/models/Content';

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
    createdAt: new Date(),
  });

  // Increment comment count in Content model
  await Content.findByIdAndUpdate(contentId, { $inc: { comments: 1 } });

  return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('id');
  if (!commentId) {
    return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (comment.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await Comment.findByIdAndDelete(commentId);

  // Decrement comment count in Content model
  await Content.findOneAndUpdate({ _id: comment.contentId }, { $inc: { comments: -1 } });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, text } = await req.json();
  if (!id || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await dbConnect();
  const comment = await Comment.findById(id);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (comment.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  comment.text = text;
  // Mark as edited if you want:
  // comment.edited = true; // If you had an edited field
  await comment.save();

  return NextResponse.json({ success: true }, { status: 200 });
}
