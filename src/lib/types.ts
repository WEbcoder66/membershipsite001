// src/lib/types.ts

export type MembershipTier = 'basic' | 'premium' | 'allAccess';

export interface Post {
  id: string;
  slug: string;
  type: 'video' | 'post' | 'gallery' | 'audio' | 'poll';
  title: string;
  description: string;
  content?: string;
  createdAt: string;
  tier: MembershipTier;
  isLocked: boolean;
  likes: number;
  comments: number;
  price?: number;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  mediaContent?: {
    video?: {
      url: string;
      thumbnail: string;
      duration: string;
      title?: string;
      quality?: string;
      subtitles?: {
        language: string;
        url: string;
      }[];
    };
    gallery?: {
      images: string[];
      captions?: string[];
    };
    audio?: {
      url: string;
      duration: string;
      coverImage?: string;
      chapters?: {
        title: string;
        timestamp: number;
      }[];
    };
    poll?: {
      options: Record<string, number>;
      endDate: string;
      multipleChoice: boolean;
    };
  };
  interactions?: {
    reactions: {
      type: string;
      count: number;
    }[];
    hasReported: boolean;
    isSaved: boolean;
    shares: number;
  };
  tags?: string[];
  category?: string;
}

export interface Content extends Omit<Post, 'slug'> {
  // Content extends Post but doesn't require a slug
}

// Rest of the types remain the same...
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membershipTier?: MembershipTier;
  isAdmin?: boolean;
  joinedAt: string;
  purchases: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  variants?: {
    type: string;
    options: string[];
  }[];
  inStock: boolean;
  shipping: {
    free: boolean;
    estimate: string;
  };
  memberDiscount?: {
    tier: MembershipTier;
    percentage: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    tier?: MembershipTier;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SearchParams {
  query?: string;
  category?: string;
  tier?: MembershipTier;
  sortBy?: 'newest' | 'popular' | 'price-low' | 'price-high';
  page?: number;
  limit?: number;
}