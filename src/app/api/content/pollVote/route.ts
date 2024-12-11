import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { contentId, option } = await req.json();

    if (!contentId || !option) return NextResponse.json({ error: 'Missing contentId or option' }, { status: 400 });

    const content = await Content.findById(contentId);
    if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    if (!content.mediaContent?.poll?.options || !(option in content.mediaContent.poll.options)) {
      return NextResponse.json({ error: 'Invalid poll option' }, { status: 400 });
    }

    content.mediaContent.poll.options[option] += 1;
    await content.save();

    return NextResponse.json({ success: true, data: content.mediaContent.poll }, { status: 200 });
  } catch (error: any) {
    console.error('Poll vote error:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}
