interface BunnyConfig {
  apiKey: string;
  libraryId: string;
  cdnUrl: string;
  securityKey: string;
}

export class BunnyVideoService {
  private readonly API_BASE_URL = 'https://video.bunnycdn.com/library';
  private readonly config: BunnyConfig;

  constructor() {
    this.config = {
      apiKey: process.env.BUNNY_API_KEY || '',
      libraryId: process.env.BUNNY_LIBRARY_ID || '',
      cdnUrl: process.env.BUNNY_CDN_URL || '',
      securityKey: process.env.BUNNY_SECURITY_KEY || ''
    };

    if (!this.config.apiKey || !this.config.libraryId || !this.config.cdnUrl || !this.config.securityKey) {
      throw new Error(
        'Missing required Bunny.net configuration. Please ensure BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_URL, and BUNNY_SECURITY_KEY are set.'
      );
    }
  }

  // Create a new video on Bunny.net
  async createVideo(title: string): Promise<{ guid: string }> {
    const response = await fetch(`${this.API_BASE_URL}/${this.config.libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.statusText}`);
    }

    return response.json();
  }

  // Upload video data to Bunny.net
  async uploadVideo(videoId: string, data: ArrayBuffer): Promise<void> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}/videos/${videoId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': this.config.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: data
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }
  }

  // Generate secure URL for video or thumbnail
  async getVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const expires = timestamp + 3600; // 1 hour
    const pathPart = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
    const hashableBase = `${this.config.securityKey}${videoId}/${pathPart}${expires}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(hashableBase);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.securityKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const token = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `${this.config.cdnUrl}/${videoId}/${pathPart}?token=${token}&expires=${expires}`;
  }

  // Delete a video from Bunny.net
  async deleteVideo(videoId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/${this.config.libraryId}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'AccessKey': this.config.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.statusText}`);
    }
  }

  // Update the title of a video on Bunny.net
  async updateVideoTitle(videoId: string, title: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/${this.config.libraryId}/videos/${videoId}`, {
      method: 'PATCH',
      headers: {
        'AccessKey': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`Failed to update video title: ${response.statusText}`);
    }
  }

  // List videos from Bunny.net with pagination
  async listVideos(page: number = 1, perPage: number = 100): Promise<{ items: any[]; totalItems: number }> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}/videos?page=${page}&perPage=${perPage}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessKey': this.config.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video list: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export a single instance of the BunnyVideoService
export const bunnyVideo = new BunnyVideoService();
