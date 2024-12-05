interface BunnyConfig {
  apiKey: string;
  libraryId: string;
  cdnUrl: string; 
  securityKey: string;
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
    
    console.log('Making request to:', url, {
      method: options.method,
      headers: options.headers
    });

    const headers = {
      'AccessKey': this.config.apiKey,
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Bunny.net API error:', {
        status: response.status,
        url,
        error
      });
      throw new Error(`Bunny.net API error (${response.status}): ${error}`);
    }
    return response.json();
  }

  private generateToken(videoId: string): { token: string, expires: number } {
    const timestamp = Math.floor(Date.now() / 1000);
    const expires = timestamp + 3600; // Token valid for 1 hour
    const hashableBase = `${this.config.securityKey}${videoId}${expires}`;
    
    // Use Web Crypto API for browser compatibility
    const encoder = new TextEncoder();
    const data = encoder.encode(hashableBase);
    const token = Array.from(new Uint8Array(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return { token, expires };
  }

  public getVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): string {
    if (type === 'video') {
      // Use Bunny's iframe player URL for videos
      return `https://iframe.mediadelivery.net/play/${this.config.libraryId}/${videoId}`;
    }
    
    // For thumbnails, use CDN URL with token
    const { token, expires } = this.generateToken(videoId);
    return `${this.config.cdnUrl}/${videoId}/thumbnail.jpg?token=${token}&expires=${expires}`;
  }

  async getUploadUrl(title: string): Promise<{ id: string; uploadUrl: string }> {
    try {
      console.log('Getting upload URL for video:', { title });
      const { guid } = await this.makeRequest<{ guid: string }>('/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      
      const uploadUrl = `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`;
      console.log('Upload URL generated successfully:', { guid, uploadUrl });
      
      return {
        id: guid,
        uploadUrl
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  }

  async createVideo(title: string): Promise<{ guid: string }> {
    return this.makeRequest<{ guid: string }>('/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
  }

  async uploadVideo(guid: string, fileData: ArrayBuffer): Promise<void> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': this.config.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: fileData
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload video: ${error}`);
    }
  }

  async directUpload(uploadUrl: string, file: File): Promise<void> {
    try {
      console.log('Starting direct upload to:', uploadUrl);
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      console.log('Direct upload completed successfully');
    } catch (error) {
      console.error('Direct upload error:', error);
      throw error;
    }
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
  cdnUrl: process.env.BUNNY_CDN_URL || '',
  securityKey: process.env.BUNNY_SECURITY_KEY || ''
});

// Add logging to help debug initialization
console.log('Initializing BunnyVideoService with:', {
  hasApiKey: !!process.env.BUNNY_API_KEY,
  hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
  hasCdnUrl: !!process.env.BUNNY_CDN_URL,
  hasSecurityKey: !!process.env.BUNNY_SECURITY_KEY
});