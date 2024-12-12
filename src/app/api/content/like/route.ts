// src/app/api/content/like/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId } = await req.json();
  if (!contentId) {
    return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
  }

  await dbConnect();
  const userId = session.user.id;
  const content = await Content.findById(contentId);
  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  const alreadyLiked = content.likedBy.includes(userId);
  if (alreadyLiked) {
    // Unlike
    content.likedBy = content.likedBy.filter((id: string) => id !== userId);
    content.likes = content.likes - 1;
  } else {
    // Like
    content.likedBy.push(userId);
    content.likes = content.likes + 1;
  }

  await content.save();

  return NextResponse.json({ success: true, likes: content.likes });
}
