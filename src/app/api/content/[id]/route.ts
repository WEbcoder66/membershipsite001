import { NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/auth';
import { bunnyVideo } from '@/lib/bunnyService';
import Content from '@/models/Content';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET specific content
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const content = await Content.findById(params.id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If content has video, generate secure URLs
    if (content.type === 'video' && content.mediaContent?.video?.videoId) {
      const embedUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${content.mediaContent.video.videoId}`;
      const thumbnailUrl = await bunnyVideo.getVideoUrl(content.mediaContent.video.videoId, 'thumbnail');
      
      content.mediaContent.video.url = embedUrl;
      content.mediaContent.video.thumbnail = thumbnailUrl;
    }

    return NextResponse.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// UPDATE content
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate admin access
    const validation = await validateAdmin();
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await req.json();
    const content = await Content.findById(params.id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If updating video title in Bunny.net
    if (updates.title && content.type === 'video' && content.mediaContent?.video?.videoId) {
      await bunnyVideo.updateVideoTitle(content.mediaContent.video.videoId, updates.title);
    }

    // Update content in database
    const updatedContent = await Content.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE content
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate admin access
    const validation = await validateAdmin();
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const content = await Content.findById(params.id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Delete from Bunny.net if it's a video
    if (content.type === 'video' && content.mediaContent?.video?.videoId) {
      try {
        await bunnyVideo.deleteVideo(content.mediaContent.video.videoId);
        console.log('Deleted video from Bunny.net:', content.mediaContent.video.videoId);
      } catch (error) {
        console.error('Failed to delete from Bunny.net:', error);
        // Continue with database deletion even if Bunny.net deletion fails
      }
    }

    // Delete from database
    await Content.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}