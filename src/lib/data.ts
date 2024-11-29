// src/lib/data.ts
import { Post } from './types';

export const socialLinks = [
  { platform: 'twitter', url: 'https://twitter.com/superdope' },
  { platform: 'instagram', url: 'https://instagram.com/superdope' },
  { platform: 'youtube', url: 'https://youtube.com/superdope' },
  { platform: 'facebook', url: 'https://facebook.com/superdope' }
];

export const MEMBERSHIP_TIERS = {
  basic: {
    name: 'Basic',
    price: 4.99,
    annualPrice: 49.99,
    features: [
      'Access to basic content',
      'Early access to posts',
      'Community updates',
      'Behind the scenes content'
    ],
    color: 'yellow-300',
    popular: false
  },
  creator: {
    name: 'Creator',
    price: 9.99,
    annualPrice: 99.99,
    features: [
      'All Basic features',
      'Exclusive tutorials',
      'Premium content access',
      'Priority support',
      'Monthly live sessions'
    ],
    color: 'yellow-400',
    popular: true
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    annualPrice: 199.99,
    features: [
      'All Creator features',
      '1-on-1 mentoring',
      'Custom content requests',
      'Early beta access',
      'Exclusive discord access'
    ],
    color: 'yellow-500',
    popular: false
  }
};

export const posts: Post[] = [
  {
    id: '1',
    slug: 'latest-project-behind-scenes',
    type: 'video',
    title: 'Latest Project Behind the Scenes',
    description: 'Get an exclusive look at how we create our content. Learn about our production process, equipment setup, and creative decisions.',
    content: 'Full episode content here...',
    createdAt: new Date().toISOString(),
    tier: 'premium',
    isLocked: true,
    likes: 128,
    comments: 45,
    mediaContent: {
      video: {
        url: '/videos/video1.mp4',
        thumbnail: '/images/posts/video-thumb.jpg',
        duration: '10:30',
        title: 'Behind The Scenes Episode 1',
        quality: 'HD',
        subtitles: [
          {
            language: 'English',
            url: '/subtitles/en.vtt'
          }
        ]
      }
    },
    interactions: {
      reactions: [
        { type: '👍', count: 120 },
        { type: '❤️', count: 85 },
        { type: '🎉', count: 45 }
      ],
      hasReported: false,
      isSaved: false,
      shares: 34
    },
    tags: ['behind-the-scenes', 'tutorial', 'production'],
    category: 'Education'
  },
  {
    id: '2',
    slug: 'studio-setup-tour-2024',
    type: 'gallery',
    title: 'Studio Setup Tour 2024',
    description: 'Take a tour of our newly upgraded studio! Check out our latest equipment, workspace organization, and creative setup.',
    content: 'Detailed studio tour content...',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    tier: 'basic',
    isLocked: false,
    likes: 256,
    comments: 67,
    mediaContent: {
      gallery: {
        images: [
          '/images/gallery/img1.jpg',
          '/images/gallery/img2.jpg',
          '/images/gallery/img3.jpg',
          '/images/gallery/img4.jpg'
        ],
        captions: [
          'Main recording area',
          'Lighting setup',
          'Camera equipment',
          'Post-production workspace'
        ]
      }
    },
    interactions: {
      reactions: [
        { type: '👍', count: 230 },
        { type: '❤️', count: 180 },
        { type: '🎉', count: 95 }
      ],
      hasReported: false,
      isSaved: true,
      shares: 89
    },
    tags: ['studio-tour', 'equipment', 'setup'],
    category: 'Behind The Scenes'
  },
  {
    id: '3',
    slug: 'creator-podcast-42',
    type: 'audio',
    title: 'Creator Podcast #42',
    description: 'Join us for an in-depth discussion about content creation, industry trends, and pro tips for growing your audience.',
    content: 'Full podcast transcript...',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    tier: 'basic',
    isLocked: false,
    likes: 92,
    comments: 28,
    mediaContent: {
      audio: {
        url: '/audio/podcast1.mp3',
        duration: '45:20',
        coverImage: '/images/posts/podcast-cover.jpg',
        chapters: [
          { title: 'Intro', timestamp: 0 },
          { title: 'Main Discussion', timestamp: 180 },
          { title: 'Q&A', timestamp: 1800 },
          { title: 'Wrap Up', timestamp: 2400 }
        ]
      }
    },
    interactions: {
      reactions: [
        { type: '👍', count: 85 },
        { type: '❤️', count: 42 },
        { type: '🎉', count: 28 }
      ],
      hasReported: false,
      isSaved: false,
      shares: 15
    },
    tags: ['podcast', 'interview', 'industry-news'],
    category: 'Podcast'
  },
  {
    id: '4',
    slug: 'what-should-we-create-next',
    type: 'poll',
    title: 'What Should We Create Next?',
    description: 'Help us decide our next big project! Your input shapes our content.',
    content: 'Poll details...',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    tier: 'basic',
    isLocked: false,
    likes: 89,
    comments: 23,
    mediaContent: {
      poll: {
        options: {
          'Tutorial Series': 145,
          'Documentary': 98,
          'Live Workshop': 76,
          'Case Study': 54
        },
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        multipleChoice: false
      }
    },
    interactions: {
      reactions: [
        { type: '👍', count: 85 },
        { type: '❤️', count: 42 },
        { type: '🎉', count: 28 }
      ],
      hasReported: false,
      isSaved: false,
      shares: 15
    },
    tags: ['poll', 'community', 'feedback'],
    category: 'Community'
  }
];

export const siteConfig = {
  title: 'Super Dope Content Co.',
  description: 'Creating High Quality Video & Audio Content',
  bannerImage: '/images/banners/banner.jpg',
  profileImage: '/images/profiles/profile.jpg',
  subscriberCount: '10k+',
  postCount: '100+',
  socialLinks: [
    { platform: 'twitter', url: 'https://twitter.com/superdope' },
    { platform: 'instagram', url: 'https://instagram.com/superdope' },
    { platform: 'youtube', url: 'https://youtube.com/superdope' },
    { platform: 'facebook', url: 'https://facebook.com/superdope' }
  ],
  navigation: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Membership', path: '/membership' },
    { label: 'Store', path: '/store' }
  ]
};

export const comments = [
  {
    id: 'comment1',
    postId: '1',
    user: {
      id: 'user1',
      name: 'John Doe',
      avatar: '/images/profiles/user1.jpg',
      tier: 'premium'
    },
    content: 'This is amazing content! Really helpful behind-the-scenes look.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    replies: [
      {
        id: 'reply1',
        user: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/images/profiles/user2.jpg',
          tier: 'basic'
        },
        content: 'Totally agree! The production quality is outstanding.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        likes: 12
      }
    ]
  }
];