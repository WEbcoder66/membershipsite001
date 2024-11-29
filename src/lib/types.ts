// src/lib/types.ts

export type MembershipTier = 'basic' | 'premium' | 'allAccess';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membershipTier?: MembershipTier;
  joinedAt: string;
  purchases: string[];
}

export interface Post {
  id: string;
  slug: string;
  type: 'video' | 'image' | 'poll' | 'audio' | 'gallery' | 'text';
  title: string;
  description: string;
  content: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  createdAt: string;
  tier: MembershipTier;
  price?: number;
  isLocked: boolean;
  likes: number;
  comments: number;
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
      endDate?: string;
      multipleChoice?: boolean;
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

export interface Comment {
  id: string;
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
  isEdited?: boolean;
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

export interface CartItem {
  product: Product;
  quantity: number;
  variants?: Record<string, string>;
}

export interface OrderStatus {
  label: string;
  color: string;
}

export interface PaymentStatus {
  pending: 'pending';
  completed: 'completed';
  failed: 'failed';
  refunded: 'refunded';
}

export interface ShippingMethod {
  name: string;
  price: number;
  estimate: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: keyof OrderStatus;
  paymentStatus: keyof PaymentStatus;
  shippingMethod: ShippingMethod;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'content' | 'comment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  bannerImage: string;
  profileImage: string;
  subscriberCount: string;
  postCount: string;
  socialLinks: {
    platform: string;
    url: string;
  }[];
  navigation: {
    label: string;
    path: string;
  }[];
}

export interface ApiResponse<T> {
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