// src/lib/constants.ts

export const MEMBERSHIP_TIERS = {
  free: {
    name: 'Free',
    price: 0.00,
    annualPrice: 0.00,
    features: [
      "Access to weekly content updates",
      "Basic community features",
      "Members-only newsletter",
      "Early announcements"
    ],
    color: 'yellow-300',
    popular: false
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    annualPrice: 99.99,
    features: [
      "All Free features",
      "Exclusive premium content",
      "Priority support",
      "Monthly live sessions",
      "Special member events"
    ],
    color: 'yellow-400',
    popular: true
  },
  allAccess: {
    name: 'All-Access',
    price: 19.99,
    annualPrice: 199.99,
    features: [
      "All Premium features",
      "1-on-1 monthly mentoring",
      "Custom content requests",
      "Behind-the-scenes access",
      "Exclusive discord channel"
    ],
    color: 'yellow-500',
    popular: false
  }
} as const;

export const STORE_CATEGORIES = [
  'All',
  'Merchandise',
  'Digital Products',
  'Physical Products',
  'Limited Edition'
] as const;

export const CONTENT_TYPES = [
  { id: 'post', label: 'Post' },
  { id: 'video', label: 'Video' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'audio', label: 'Audio' },
  { id: 'poll', label: 'Poll' }
] as const;

export const USER_ROLES = {
  member: 'member',
  admin: 'admin',
  moderator: 'moderator'
} as const;

export const NOTIFICATION_TYPES = {
  order: 'order',
  content: 'content',
  comment: 'comment',
  system: 'system'
} as const;

export const ORDER_STATUS = {
  pending: 'pending',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
  pending: 'pending',
  completed: 'completed',
  failed: 'failed',
  refunded: 'refunded'
} as const;

export const SHIPPING_METHODS = {
  standard: {
    name: 'Standard Shipping',
    price: 4.99,
    estimate: '5-7 business days'
  },
  express: {
    name: 'Express Shipping',
    price: 14.99,
    estimate: '2-3 business days'
  },
  overnight: {
    name: 'Overnight Shipping',
    price: 29.99,
    estimate: '1 business day'
  }
} as const;

export const CURRENCY = {
  code: 'USD',
  symbol: '$'
} as const;

export const API_ENDPOINTS = {
  auth: '/api/auth',
  content: '/api/content',
  store: '/api/store',
  orders: '/api/orders',
  notifications: '/api/notifications'
} as const;

export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  maxCommentLength: 1000,
  maxTitleLength: 100,
  maxDescriptionLength: 500
} as const;

export const SUPPORTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videos: ['.mp4', '.webm', '.mov'],
  audio: ['.mp3', '.wav', '.m4a']
} as const;
