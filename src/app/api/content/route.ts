import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { bunnyVideo } from '@/lib/bunnyService';
import Content from '@/models/Content';

// Set runtime configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET endpoint to fetch content
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const tier = url.searchParams.get('tier');
    const type = url.searchParams.get('type');
    
    // Build query based on parameters
    const query: any = {};
    if (tier) query.tier = tier;
    if (type) query.type = type;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [content, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Content.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Content API GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create new content
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Verify authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, title, description, tier, mediaContent } = await req.json();
    
    // Get secure URLs using the bunnyVideo service
    const videoId = mediaContent?.video?.videoId;
    let videoUrl;
    
    if (videoId) {
      try {
        // Await the video URL here
        videoUrl = await bunnyVideo.getVideoUrl(videoId, 'video');
        const thumbnailUrl = await bunnyVideo.getVideoUrl(videoId, 'thumbnail');
        
        // Construct the content data with resolved URLs
        const contentData = {
          type,
          title,
          description,
          tier,
          mediaContent: {
            video: {
              url: videoUrl, // Now this is a string, not a Promise
              thumbnail: thumbnailUrl,
              videoId,
              title: mediaContent.video.title
            }
          },
          isLocked: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const content = await Content.create(contentData);
        return NextResponse.json({ 
          success: true, 
          data: content 
        });
      } catch (error) {
        console.error('Error generating video URLs:', error);
        throw new Error('Failed to generate secure video URLs');
      }
    } else {
      // Handle non-video content
      const content = await Content.create({
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
        data: content 
      });
    }

  } catch (error) {
    console.error('Content API POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update content
export async function PUT(req: Request) {
  try {
    await dbConnect();
    
    // Verify authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    // Handle video URL updates if necessary
    if (updates.mediaContent?.video?.videoId) {
      const videoId = updates.mediaContent.video.videoId;
      updates.mediaContent.video.url = await bunnyVideo.getVideoUrl(videoId, 'video');
      updates.mediaContent.video.thumbnail = await bunnyVideo.getVideoUrl(videoId, 'thumbnail');
    }

    const updatedContent = await Content.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedContent
    });

  } catch (error) {
    console.error('Content API PUT Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove content
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    
    // Verify authorization
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get content before deletion to check for video
    const content = await Content.findById(id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If content has video, delete from Bunny.net
    if (content.mediaContent?.video?.videoId) {
      try {
        await bunnyVideo.deleteVideo(content.mediaContent.video.videoId);
      } catch (error) {
        console.error('Failed to delete video from Bunny.net:', error);
        // Continue with content deletion even if video deletion fails
      }
    }

    // Delete the content
    await Content.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Content API DELETE Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS endpoint for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}