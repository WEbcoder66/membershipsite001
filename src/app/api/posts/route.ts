// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return demo posts
    // Later, fetch from your database or content management system
    const posts = [
      {
        id: '1',
        slug: 'latest-project',
        title: 'Latest Project',
        description: 'Check out our latest project!',
        type: 'video',
        createdAt: new Date().toISOString(),
        tier: 'free', // Changed from 'basic' to 'free'
        isLocked: false,
        likes: 0,
        comments: 0,
        content: '',
        mediaContent: {
          video: {
            url: '/videos/demo.mp4',
            thumbnail: '/images/thumbnail.jpg',
            duration: '5:00'
          }
        }
      }
      // Add more demo posts as needed
    ];

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
