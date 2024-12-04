// src/lib/videoUtils.ts

/**
 * Constructs the proper video URL for Bunny.net CDN with token authentication
 */
export async function getBunnyVideoUrl(videoId: string, type: 'video' | 'thumbnail' = 'video'): Promise<string> {
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL;
  const securityKey = process.env.BUNNY_SECURITY_KEY;

  if (!cdnUrl) {
    console.error('NEXT_PUBLIC_BUNNY_CDN_URL is not defined');
    return '';
  }

  if (!securityKey) {
    console.error('BUNNY_SECURITY_KEY is not defined');
    return '';
  }

  // Remove any trailing slashes from CDN URL
  const baseUrl = cdnUrl.replace(/\/$/, '');
  
  try {
    // Generate token
    const timestamp = Math.floor(Date.now() / 1000);
    const expiration = timestamp + 3600; // Token valid for 1 hour
    const hashableBase = `${securityKey}${videoId}${expiration}`;

    // Use Web Crypto API for browser compatibility
    const encoder = new TextEncoder();
    const data = encoder.encode(hashableBase);
    const secretKey = encoder.encode(securityKey);
    
    const key = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const token = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Construct the full URL based on type with token
    const path = type === 'thumbnail' ? 'thumbnail.jpg' : 'play.mp4';
    return `${baseUrl}/${videoId}/${path}?token=${token}&expires=${expiration}`;
  } catch (error) {
    console.error('Failed to generate token:', error);
    return '';
  }
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