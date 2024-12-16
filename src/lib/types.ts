export type MembershipTier = 'free' | 'premium' | 'allAccess';
export type ContentType = 'post' | 'video' | 'photo' | 'audio' | 'poll'; 
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type NotificationType = 'order' | 'content' | 'comment' | 'system';
export type UserRole = 'member' | 'admin' | 'moderator';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  content?: string;
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
  comments?: number;
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
    reactions: { type: string; count: number }[];
    hasReported: boolean;
    isSaved: boolean;
    shares: number;
  };
  tags?: string[];
  category?: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string; 
  avatar?: string;
  membershipTier?: MembershipTier;
  isAdmin?: boolean;
  joinedAt: string;
  purchases: string[];
  role?: UserRole;
  lastLogin?: string;
  settings?: UserSettings;
}

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
