// src/app/api/content/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { bunnyVideo } from '@/lib/bunnyService';
import Content from '@/models/Content';
import { validateAdmin } from '@/lib/auth';

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
    const searchQuery = url.searchParams.get('search');
    
    console.log('Fetching content with params:', { page, limit, tier, type, searchQuery });

    const query: any = {};
    if (tier) query.tier = tier;
    if (type) query.type = type;
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    console.log('Executing MongoDB query:', { query, skip, limit });

    const [content, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Content.countDocuments(query)
    ]);

    console.log(`Found ${content.length} items out of ${total} total`);

    // Generate secure URLs for content with videos
    const contentWithUrls = await Promise.all(content.map(async (item) => {
      if (item.mediaContent?.video?.videoId) {
        try {
          console.log('Processing video with ID:', item.mediaContent.video.videoId);
          const embedUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${item.mediaContent.video.videoId}`;
          const thumbnailUrl = await bunnyVideo.getVideoUrl(item.mediaContent.video.videoId, 'thumbnail');
          
          return {
            ...item,
            mediaContent: {
              ...item.mediaContent,
              video: {
                ...item.mediaContent.video,
                url: embedUrl,
                thumbnail: thumbnailUrl
              }
            }
          };
        } catch (error) {
          console.error(`Error processing video ${item.mediaContent.video.videoId}:`, error);
          return item;
        }
      }
      return item;
    }));

    return NextResponse.json({
      success: true,
      data: contentWithUrls,
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
    
    if (!type || !title || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const videoId = mediaContent?.video?.videoId;
    let processedMediaContent = mediaContent;
    
    if (videoId) {
      try {
        const embedUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}`;
        const thumbnailUrl = await bunnyVideo.getVideoUrl(videoId, 'thumbnail');
        
        processedMediaContent = {
          video: {
            ...mediaContent.video,
            url: embedUrl,
            thumbnail: thumbnailUrl
          }
        };
      } catch (error) {
        console.error('Error processing video URLs:', error);
        throw new Error('Failed to generate video URLs');
      }
    }

    const content = await Content.create({
      type,
      title,
      description,
      tier,
      mediaContent: processedMediaContent,
      isLocked: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created new content:', content);

    return NextResponse.json({ 
      success: true, 
      data: content 
    });

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

    updates.updatedAt = new Date();

    if (updates.mediaContent?.video?.videoId) {
      const videoId = updates.mediaContent.video.videoId;
      updates.mediaContent.video.url = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}`;
      updates.mediaContent.video.thumbnail = await bunnyVideo.getVideoUrl(videoId, 'thumbnail');
    }

    const updatedContent = await Content.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

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

    // Validate admin access
    const validation = await validateAdmin();
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message || 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const content = await Content.findById(id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If content has video, delete from Bunny if needed
    if (content.mediaContent?.video?.videoId) {
      try {
        await bunnyVideo.deleteVideo(content.mediaContent.video.videoId);
        console.log('Successfully deleted video from Bunny.net:', content.mediaContent.video.videoId);
      } catch (error) {
        console.error('Failed to delete video from Bunny.net:', error);
        // Continue with content deletion even if video deletion fails
      }
    }

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
