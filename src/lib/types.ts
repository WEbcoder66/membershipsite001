// src/lib/types.ts

export type MembershipTier = 'basic' | 'premium' | 'allAccess';
export type ContentType = 'post' | 'video' | 'gallery' | 'audio' | 'poll';

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

export interface Post {
  id: string;
  slug: string;
  type: ContentType;
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
      videoId?: string;
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

export interface CartItem {
  product: Product;
  quantity: number;
  variants?: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: string;
  thumbnail: string;
  url: string;
  quality?: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
}

export interface AdminSettings {
  siteTitle: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  features: {
    comments: boolean;
    likes: boolean;
    sharing: boolean;
    profiles: boolean;
  };
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    secure: boolean;
  };
  social: {
    platform: string;
    url: string;
    icon: string;
  }[];
}

export interface ContentStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  topContent: {
    id: string;
    title: string;
    views: number;
    likes: number;
  }[];
  recentActivity: {
    type: 'comment' | 'like' | 'view';
    contentId: string;
    userId: string;
    timestamp: string;
  }[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  membershipBreakdown: Record<MembershipTier, number>;
  recentSignups: {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
  }[];
  engagementStats: {
    commentsPerUser: number;
    likesPerUser: number;
    averageSessionDuration: number;
  };
}