// src/lib/bunnyService.ts
interface BunnyConfig {
  apiKey: string;
  libraryId: string;
  cdnUrl: string;
}

export class BunnyVideoService {
  private config: BunnyConfig;

  constructor(config: BunnyConfig) {
    this.config = config;
  }

  async uploadVideo(file: File, title: string): Promise<string> {
    try {
      // Step 1: Get upload URL from Bunny.net
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${this.config.libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title })
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { guid } = await uploadResponse.json();

      // Step 2: Upload the video file
      const uploadResult = await fetch(
        `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${guid}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': this.config.apiKey
          },
          body: file
        }
      );

      if (!uploadResult.ok) {
        throw new Error('Failed to upload video');
      }

      // Return the video URL
      return `${this.config.cdnUrl}/${guid}/play.mp4`;
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  async deleteVideo(guid: string): Promise<void> {
    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${guid}`,
        {
          method: 'DELETE',
          headers: {
            'AccessKey': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
    } catch (error) {
      console.error('Video deletion error:', error);
      throw error;
    }
  }

  async getVideoInfo(guid: string): Promise<any> {
    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${guid}`,
        {
          headers: {
            'AccessKey': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get video info');
      }

      return response.json();
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }
}

export const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.NEXT_PUBLIC_BUNNY_API_KEY || '',
  libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.NEXT_PUBLIC_BUNNY_CDN_URL || ''
});