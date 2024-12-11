// src/lib/types.ts

// Basic type definitions
export type MembershipTier = 'basic' | 'premium' | 'allAccess';
export type ContentType = 'post' | 'video' | 'photo' | 'audio' | 'poll'; // replaced 'gallery' with 'photo'
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type NotificationType = 'order' | 'content' | 'comment' | 'system';
export type UserRole = 'member' | 'admin' | 'moderator';

// Content interface
export interface Content {
  id: string;
  type: ContentType;
  title: string;
  content?: string;  // Added content field
  description?: string;
  createdAt: string;
  updatedAt?: string;
  tier: MembershipTier;
  isLocked: boolean;
  mediaContent?: {
    video?: {
      videoId: string;
      url: string;
      thumbnail: string;
      duration?: string;
      title: string;
      quality?: string;
      subtitles?: {
        language: string;
        url: string;
      }[];
    };
    photo?: {
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
  likes?: number;
  comments?: number;
  views?: number;
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published' | 'archived';
}

// Post interface
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
      videoId: string;
      title?: string;
      quality?: string;
      subtitles?: {
        language: string;
        url: string;
      }[];
    };
    photo?: {
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

// Product interface
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

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membershipTier?: MembershipTier;
  isAdmin?: boolean;
  joinedAt: string;
  purchases: string[];
  role?: UserRole;
  lastLogin?: string;
  settings?: UserSettings;
}

// User Settings interface
export interface UserSettings {
  notifications: boolean;
  emailPreferences: {
    marketing: boolean;
    updates: boolean;
    newsletter: boolean;
  };
  displayName?: string;
  timezone?: string;
  language?: string;
}

// Comment interface
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
  isEdited?: boolean;
  editedAt?: string;
}

// Order interface
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

// Order Item interface
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  variants?: Record<string, string>;
  discount?: {
    type: 'percentage' | 'fixed';
    amount: number;
  };
}

// Address interface
export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

// Service Response interface
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Subscription interface
export interface Subscription {
  id: string;
  userId: string;
  tier: MembershipTier;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  paymentMethod: {
    type: string;
    last4?: string;
    expiryDate?: string;
  };
  price: number;
  interval: 'monthly' | 'yearly';
  cancelReason?: string;
}

// Video Metadata interface
export interface VideoMetadata {
  videoId: string;
  title: string;
  description?: string;
  duration: string;
  thumbnail: string;
  quality: string;
  size: number;
  format: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Analytics Event interface
export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  contentId?: string;
  metadata: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
}

// Site Settings interface
export interface SiteSettings {
  title: string;
  description: string;
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
