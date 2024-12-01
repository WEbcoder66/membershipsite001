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

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.API_BASE_URL}/${this.config.libraryId}${endpoint}`;
    const headers = {
      'AccessKey': this.config.apiKey,
      ...options.headers
    };

    console.log('Making request to:', url);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bunny.net API error:', error);
      throw new Error(`Bunny.net API error: ${error}`);
    }

    return response.json();
  }

  async uploadVideo(file: File, title: string): Promise<string> {
    try {
      console.log('Starting video upload process:', { title, fileSize: file.size });
      
      // Step 1: Create video entry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      console.log('Creating video entry...');
      const createResponse = await this.makeRequest<{ guid: string }>('', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const { guid } = createResponse;
      console.log('Video entry created with GUID:', guid);

      // Step 2: Upload video file with chunk handling
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const arrayBuffer = await file.arrayBuffer();
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
      
      console.log(`Uploading file in ${totalChunks} chunks...`);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
        const chunk = arrayBuffer.slice(start, end);
        const uploadController = new AbortController();
        const uploadTimeoutId = setTimeout(() => uploadController.abort(), 30000); // 30 second timeout per chunk
        
        console.log(`Uploading chunk ${i + 1}/${totalChunks}`);
        
        await this.makeRequest<void>(`/videos/${guid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end-1}/${arrayBuffer.byteLength}`
          },
          body: chunk,
          signal: uploadController.signal
        });
        
        clearTimeout(uploadTimeoutId);
        console.log(`Chunk ${i + 1} uploaded successfully`);
      }

      // Return the CDN URL for the uploaded video
      const videoUrl = `${this.config.cdnUrl}/${guid}/play.mp4`;
      console.log('Upload completed successfully:', videoUrl);
      return videoUrl;

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - please try again with a smaller file or check your connection');
        }
        console.error('Bunny.net upload error:', error);
        throw error;
      }
      const errorMessage = error instanceof Object ? JSON.stringify(error) : String(error);
      throw new Error(`Upload failed: ${errorMessage}`);
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