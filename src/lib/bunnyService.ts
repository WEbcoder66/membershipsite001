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
  length: number;
}

interface BunnyVideoCollection {
  totalItems: number;
  items: BunnyVideoResponse[];
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export class BunnyVideoService {
  private config: BunnyConfig;
  private readonly API_BASE_URL = 'https://video.bunnycdn.com/library';

  constructor(config: BunnyConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}${endpoint}`;
    
    // Log request details
    console.log('Making Bunny.net request:', {
      url,
      method: options.method || 'GET',
      hasBody: !!options.body,
      headers: options.headers
    });
    const headers = {
      'AccessKey': this.config.apiKey,
      ...options.headers
    };
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bunny.net API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Bunny.net API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      console.log('Bunny.net API success response:', data);
      return data;
    } catch (error) {
      console.error('Bunny.net request failed:', error);
      throw error;
    }
  }

  async createVideo(title: string): Promise<{ guid: string }> {
    return this.makeRequest<{ guid: string }>('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
  }

  async uploadVideo(guid: string, fileData: Buffer | ArrayBuffer): Promise<void> {
    await this.makeRequest<void>(`/videos/${guid}`, {
      method: 'PUT',
      body: fileData
    });
  }

  async deleteVideo(guid: string): Promise<void> {
    try {
      console.log('Deleting video from Bunny.net:', { guid });
      await this.makeRequest<void>(`/videos/${guid}`, {
        method: 'DELETE'
      });
      console.log('Video deleted successfully');
    } catch (error) {
      console.error('Video deletion error:', error);
      throw error;
    }
  }

  async getVideoInfo(guid: string): Promise<BunnyVideoResponse> {
    try {
      console.log('Fetching video info from Bunny.net:', { guid });
      const videoInfo = await this.makeRequest<BunnyVideoResponse>(`/videos/${guid}`);
      console.log('Video info retrieved successfully:', videoInfo);
      return videoInfo;
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  async listVideos(page: number = 1, perPage: number = 100): Promise<BunnyVideoCollection> {
    try {
      console.log('Fetching video list from Bunny.net:', { page, perPage });
      const response = await this.makeRequest<BunnyVideoCollection>(
        `/videos?page=${page}&itemsPerPage=${perPage}`
      );
      console.log(`Retrieved ${response.items.length} videos`);
      return response;
    } catch (error) {
      console.error('List videos error:', error);
      throw error;
    }
  }

  async updateVideoTitle(guid: string, title: string): Promise<void> {
    try {
      console.log('Updating video title in Bunny.net:', { guid, title });
      await this.makeRequest<void>(`/videos/${guid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      console.log('Video title updated successfully');
    } catch (error) {
      console.error('Update video title error:', error);
      throw error;
    }
  }

  async reencode(guid: string): Promise<void> {
    try {
      console.log('Requesting video reencode:', { guid });
      await this.makeRequest<void>(`/videos/${guid}/reencode`, {
        method: 'POST'
      });
      console.log('Reencode request successful');
    } catch (error) {
      console.error('Reencode request error:', error);
      throw error;
    }
  }

  async setVideoThumbnail(guid: string, thumbnailUrl: string): Promise<void> {
    try {
      console.log('Setting video thumbnail:', { guid, thumbnailUrl });
      await this.makeRequest<void>(`/videos/${guid}/thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ thumbnailUrl })
      });
      console.log('Thumbnail set successfully');
    } catch (error) {
      console.error('Set thumbnail error:', error);
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