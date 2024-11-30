// src/lib/bunnyService.ts

interface BunnyConfig {
  apiKey: string;
  libraryId: string;
  cdnUrl: string;
}

interface BunnyVideoResponse {
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  status: number;
  storageSize: number;
  thumbnail: string;
}

export class BunnyVideoService {
  private config: BunnyConfig;
  private readonly API_BASE_URL = 'https://video.bunnycdn.com/library';

  constructor(config: BunnyConfig) {
    this.config = config;
  }

  async uploadVideo(file: File, title: string): Promise<string> {
    try {
      // Step 1: Create video in Bunny.net library
      console.log('Creating video in Bunny.net library:', { title });
      const createResponse = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title })
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create video: ${error}`);
      }

      const { guid } = await createResponse.json();

      // Step 2: Upload the video file
      console.log('Uploading video file to Bunny.net:', { guid });
      const arrayBuffer = await file.arrayBuffer();
      const uploadResponse = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': this.config.apiKey,
            'Content-Type': 'application/octet-stream'
          },
          body: arrayBuffer
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Failed to upload video: ${error}`);
      }

      // Return the CDN URL for the video
      const videoUrl = `${this.config.cdnUrl}/${guid}/play.mp4`;
      console.log('Video upload successful:', { videoUrl });
      return videoUrl;

    } catch (error) {
      console.error('Bunny.net upload error:', error);
      throw error;
    }
  }

  async deleteVideo(guid: string): Promise<void> {
    try {
      console.log('Deleting video from Bunny.net:', { guid });
      const response = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`,
        {
          method: 'DELETE',
          headers: {
            'AccessKey': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete video: ${error}`);
      }

      console.log('Video deleted successfully');
    } catch (error) {
      console.error('Video deletion error:', error);
      throw error;
    }
  }

  async getVideoInfo(guid: string): Promise<BunnyVideoResponse> {
    try {
      console.log('Fetching video info from Bunny.net:', { guid });
      const response = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`,
        {
          headers: {
            'AccessKey': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get video info: ${error}`);
      }

      const videoInfo = await response.json();
      console.log('Video info retrieved successfully:', videoInfo);
      return videoInfo;
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  async updateVideoTitle(guid: string, title: string): Promise<void> {
    try {
      console.log('Updating video title in Bunny.net:', { guid, title });
      const response = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`,
        {
          method: 'POST',
          headers: {
            'AccessKey': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update video title: ${error}`);
      }

      console.log('Video title updated successfully');
    } catch (error) {
      console.error('Update video title error:', error);
      throw error;
    }
  }

  async listVideos(page: number = 1, perPage: number = 100): Promise<BunnyVideoResponse[]> {
    try {
      console.log('Fetching video list from Bunny.net:', { page, perPage });
      const response = await fetch(
        `${this.API_BASE_URL}/${this.config.libraryId}/videos?page=${page}&itemsPerPage=${perPage}`,
        {
          headers: {
            'AccessKey': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to list videos: ${error}`);
      }

      const videos = await response.json();
      console.log(`Retrieved ${videos.length} videos`);
      return videos;
    } catch (error) {
      console.error('List videos error:', error);
      throw error;
    }
  }
}

// Export a singleton instance with environment variables
export const bunnyVideo = new BunnyVideoService({
  apiKey: process.env.BUNNY_API_KEY || '',
  libraryId: process.env.BUNNY_LIBRARY_ID || '',
  cdnUrl: process.env.BUNNY_CDN_URL || ''
});