// src/lib/mediaService.ts
export const LOCAL_MEDIA = {
  videos: {
    'demo-video-1': {
      url: '/videos/demo1.mp4',
      thumbnail: '/images/posts/demo1-thumb.jpg',
      duration: '10:30'
    },
    'demo-video-2': {
      url: '/videos/demo2.mp4',
      thumbnail: '/images/posts/demo2-thumb.jpg',
      duration: '15:45'
    }
  },
  images: {
    gallery: [
      '/images/gallery/image1.jpg',
      '/images/gallery/image2.jpg',
      '/images/gallery/image3.jpg',
      '/images/gallery/image4.jpg'
    ],
    profiles: {
      default: '/images/profiles/default-profile.jpg'
    },
    banners: {
      default: '/images/banners/default-banner.jpg'
    }
  }
};

export function getVideoData(videoId: string) {
  return LOCAL_MEDIA.videos[videoId as keyof typeof LOCAL_MEDIA.videos] || null;
}

export function getGalleryImages() {
  return LOCAL_MEDIA.images.gallery;
}

export function getProfileImage() {
  return LOCAL_MEDIA.images.profiles.default;
}

export function getBannerImage() {
  return LOCAL_MEDIA.images.banners.default;
}