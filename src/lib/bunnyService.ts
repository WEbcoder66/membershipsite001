// src/lib/bunnyService.ts

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
  private readonly API_BASE_URL = 'https://video.bunnycdn.com/library';
  private readonly config: BunnyConfig;

  constructor() {
    // Initialize configuration from environment variables
    this.config = {
      apiKey: process.env.BUNNY_API_KEY || '',
      libraryId: process.env.BUNNY_LIBRARY_ID || '',
      cdnUrl: process.env.BUNNY_CDN_URL || '',
      securityKey: process.env.BUNNY_SECURITY_KEY || ''
    };

    // Validate required configuration
    if (!this.config.apiKey || !this.config.libraryId || !this.config.cdnUrl || !this.config.securityKey) {
      console.error('Missing Bunny.net configuration:', {
        hasApiKey: !!this.config.apiKey,
        hasLibraryId: !!this.config.libraryId,
        hasCdnUrl: !!this.config.cdnUrl,
        hasSecurityKey: !!this.config.securityKey
      });
      throw new Error('Missing required Bunny.net configuration');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}${endpoint}`;
    
    console.log('Making Bunny.net API request:', {
      url,
      method: options.method || 'GET',
      endpoint
    });

    const headers = {
      'AccessKey': this.config.apiKey,
      ...options.headers
    };

    try {
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
    } catch (error) {
      console.error('Bunny.net request failed:', error);
      throw error;
    }
  }

  private async generateToken(videoId: string, path: string = 'video'): Promise<{ token: string; expires: number }> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const expires = timestamp + 3600; // 1 hour expiration
      const pathPart = path === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
      const hashableBase = `${this.config.securityKey}${videoId}/${pathPart}${expires}`;
      
      // Use Web Crypto API for HMAC-SHA256
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

      console.log('Generated security token:', {
        videoId,
        expires,
        pathPart,
        tokenLength: token.length
      });

      return { token, expires };
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate security token');
    }
  }

  async getVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): Promise<string> {
    try {
      const { token, expires } = await this.generateToken(videoId, type);
      const path = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
      const url = `${this.config.cdnUrl}/${videoId}/${path}?token=${token}&expires=${expires}`;
      
      console.log('Generated video URL:', {
        videoId,
        type,
        urlLength: url.length
      });

      return url;
    } catch (error) {
      console.error('Error getting video URL:', error);
      throw error;
    }
  }

  async getEmbedUrl(videoId: string): Promise<string> {
    return `https://iframe.mediadelivery.net/embed/${this.config.libraryId}/${videoId}`;
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
    
    console.log('Uploading video:', {
      guid,
      fileSize: fileData.byteLength
    });

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
      console.error('Video upload failed:', error);
      throw new Error(`Failed to upload video: ${error}`);
    }
  }

  async deleteVideo(guid: string): Promise<void> {
    try {
      await this.makeRequest<void>(`/videos/${guid}`, {
        method: 'DELETE'
      });
      console.log('Successfully deleted video:', guid);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async getVideoInfo(guid: string): Promise<BunnyVideoResponse> {
    return this.makeRequest<BunnyVideoResponse>(`/videos/${guid}`);
  }

  async listVideos(page: number = 1, perPage: number = 100): Promise<BunnyVideoCollection> {
    return this.makeRequest<BunnyVideoCollection>(
      `/videos?page=${page}&itemsPerPage=${perPage}`
    );
  }

  async updateVideoTitle(guid: string, title: string): Promise<void> {
    await this.makeRequest<void>(`/videos/${guid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
  }

  async getUploadUrl(title: string): Promise<{ id: string; uploadUrl: string }> {
    const { guid } = await this.createVideo(title);
    const uploadUrl = `${this.API_BASE_URL}/${this.config.libraryId}/videos/${guid}`;
    return { id: guid, uploadUrl };
  }

  async checkVideoStatus(guid: string): Promise<'created' | 'processing' | 'ready' | 'failed'> {
    try {
      const videoInfo = await this.getVideoInfo(guid);
      switch (videoInfo.status) {
        case 1: return 'processing';
        case 2: return 'ready';
        case 3: return 'failed';
        default: return 'created';
      }
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const bunnyVideo = new BunnyVideoService();

// Debug info on initialization
console.log('Initializing BunnyVideoService with:', {
  hasApiKey: !!process.env.BUNNY_API_KEY,
  hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
  hasCdnUrl: !!process.env.BUNNY_CDN_URL,
  hasSecurityKey: !!process.env.BUNNY_SECURITY_KEY
});