// src/lib/videoService.ts

const SPROUTVIDEO_API_KEY = process.env.SPROUTVIDEO_API_KEY;
const SPROUTVIDEO_API_URL = 'https://api.sproutvideo.com/v1';

interface VideoResponse {
  id: string;
  token: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
}

export async function createVideo(title: string, description: string) {
  try {
    const response = await fetch(`${SPROUTVIDEO_API_URL}/videos`, {
      method: 'POST',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        privacy: 'private',
        login_required: true,
        domain_restrictions: true,
        tag_restrictions: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

export async function uploadVideoFile(token: string, file: File): Promise<VideoResponse> {
  try {
    const formData = new FormData();
    formData.append('source_video', file);

    const response = await fetch(`${SPROUTVIDEO_API_URL}/videos/${token}/upload`, {
      method: 'POST',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading video file:', error);
    throw error;
  }
}

export async function getVideo(videoId: string) {
  try {
    const response = await fetch(`${SPROUTVIDEO_API_URL}/videos/${videoId}`, {
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting video:', error);
    throw error;
  }
}

export async function deleteVideo(videoId: string) {
  try {
    const response = await fetch(`${SPROUTVIDEO_API_URL}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function updateVideo(videoId: string, data: any) {
  try {
    const response = await fetch(`${SPROUTVIDEO_API_URL}/videos/${videoId}`, {
      method: 'PUT',
      headers: {
        'SproutVideo-Api-Key': SPROUTVIDEO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
}