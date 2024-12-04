// src/lib/videoUtils.ts

/**
 * Constructs the proper video URL for Bunny.net CDN
 */
export function getBunnyVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): string {
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL;
  if (!cdnUrl) {
    console.error('NEXT_PUBLIC_BUNNY_CDN_URL is not defined');
    return '';
  }

  // Remove any trailing slashes from CDN URL
  const baseUrl = cdnUrl.replace(/\/$/, '');
  
  // Construct the full URL based on type
  if (type === 'thumbnail') {
    return `${baseUrl}/${videoId}/thumbnail.jpg`;
  }
  
  return `${baseUrl}/${videoId}/play.mp4`;
}

/**
 * Validates if a URL is a valid Bunny.net video URL
 */
export function isValidBunnyVideoUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('/play.mp4') || urlObj.pathname.includes('/thumbnail.jpg');
  } catch (e) {
    return false;
  }
}