import mongoose, { Document } from 'mongoose';

type ContentType = 'video' | 'photo' | 'audio' | 'post';
type MembershipTier = 'basic' | 'premium' | 'allAccess';

interface VideoContent {
  videoId: string;
  url?: string;
  thumbnail?: string;
  duration?: string;
  title?: string;
}

interface PhotoContent {
  images: string[];
}

interface AudioContent {
  url?: string;
  duration?: string;
}

interface PollContent {
  options?: Record<string, number>;
  endDate?: Date;
  multipleChoice?: boolean;
}

interface IContent extends Document {
  type: ContentType;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tier: MembershipTier;
  isLocked: boolean;
  mediaContent?: {
    video?: VideoContent;
    photo?: PhotoContent;
    audio?: AudioContent;
    poll?: PollContent;
  };
  likes: number;
  comments: number;
  views: number;
  likedBy: string[]; // Add this array to track who liked the content
}

const ContentSchema = new mongoose.Schema<IContent>({
  type: {
    type: String,
    required: true,
    enum: ['video', 'photo', 'audio', 'post']
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
    enum: ['basic', 'premium', 'allAccess'],
    default: 'basic'
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  mediaContent: {
    video: {
      videoId: { type: String, required: function(this: IContent) { return this.type === 'video'; } },
      url: String,
      thumbnail: String,
      duration: String,
      title: String
    },
    photo: {
      images: {
        type: [String],
        required: function(this: IContent) { return this.type === 'photo'; }
      }
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

ContentSchema.pre('save', function(this: IContent, next) {
  if (this.type === 'video' && (!this.mediaContent?.video?.videoId)) {
    return next(new Error('Video content requires a videoId'));
  }
  next();
});

ContentSchema.index({ type: 1, tier: 1, createdAt: -1 });

const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
