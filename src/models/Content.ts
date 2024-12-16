import mongoose, { Document } from 'mongoose';

type ContentType = 'video' | 'photo' | 'audio' | 'post' | 'poll';
type MembershipTier = 'free' | 'premium' | 'allAccess';

interface IContent extends Document {
  type: ContentType;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tier: MembershipTier;
  isLocked: boolean;
  mediaContent?: {
    video?: {
      videoId: string;
      url?: string;
      thumbnail?: string;
      duration?: string;
      title?: string;
    };
    photo?: {
      images: string[];
    };
    audio?: {
      url?: string;
      duration?: string;
    };
    poll?: {
      options?: Record<string, number>;
      endDate?: Date;
      multipleChoice?: boolean;
    };
  };
  likes: number;
  comments: number;
  views: number;
  likedBy: string[];
}

const ContentSchema = new mongoose.Schema<IContent>({
  type: {
    type: String,
    required: true,
    enum: ['video', 'photo', 'audio', 'post', 'poll']
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tier: {
    type: String,
    required: true,
    enum: ['free', 'premium', 'allAccess'],
    default: 'free'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  mediaContent: {
    video: {
      videoId: { type: String },
      url: String,
      thumbnail: String,
      duration: String,
      title: String
    },
    photo: {
      images: { type: [String] }
    },
    audio: {
      url: String,
      duration: String
    },
    poll: {
      options: mongoose.Schema.Types.Mixed,
      endDate: Date,
      multipleChoice: Boolean
    }
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likedBy: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  collection: 'contents'
});

ContentSchema.index({ type: 1, tier: 1, createdAt: -1 });

const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
