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
    this.config = {
      apiKey: process.env.BUNNY_API_KEY || '',
      libraryId: process.env.BUNNY_LIBRARY_ID || '',
      cdnUrl: process.env.BUNNY_CDN_URL || '',
      securityKey: process.env.BUNNY_SECURITY_KEY || ''
    };

    if (!this.config.apiKey || !this.config.libraryId || !this.config.cdnUrl || !this.config.securityKey) {
      throw new Error('Missing required Bunny.net configuration');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}${endpoint}`;
    
    console.log('Making request to:', url);

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

  private async generateToken(videoId: string): Promise<{ token: string; expires: number }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const expires = timestamp + 3600; // 1 hour
    const hashableBase = `${this.config.securityKey}${videoId}${expires}`;
    
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

    return { token, expires };
  }

  // Add the getVideoUrl method
  async getVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): Promise<string> {
    const { token, expires } = await this.generateToken(videoId);
    const path = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
    return `${this.config.cdnUrl}/${videoId}/${path}?token=${token}&expires=${expires}`;
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

  async deleteVideo(guid: string): Promise<void> {
    await this.makeRequest<void>(`/videos/${guid}`, {
      method: 'DELETE'
    });
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
}

// Export a singleton instance for server-side use
export const bunnyVideo = new BunnyVideoService();

// Add logging to help debug initialization
console.log('Initializing BunnyVideoService with:', {
  hasApiKey: !!process.env.BUNNY_API_KEY,
  hasLibraryId: !!process.env.BUNNY_LIBRARY_ID,
  hasCdnUrl: !!process.env.BUNNY_CDN_URL,
  hasSecurityKey: !!process.env.BUNNY_SECURITY_KEY
});