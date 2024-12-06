// src/models/Content.ts
import mongoose, { Document } from 'mongoose';

// Define interfaces for strongly typed schema
interface IContent extends Document {
  type: 'video' | 'gallery' | 'audio' | 'poll';
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tier: 'basic' | 'premium' | 'allAccess';
  isLocked: boolean;
  mediaContent?: {
    video?: {
      videoId: string;
      url: string;
      thumbnail: string;
      duration: string;
      title: string;
    };
    gallery?: {
      images: string[];
    };
    audio?: {
      url: string;
      duration: string;
    };
    poll?: {
      options: Record<string, number>;
      endDate: Date;
      multipleChoice: boolean;
    };
  };
  likes: number;
  comments: number;
  views: number;
}

const ContentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['video', 'gallery', 'audio', 'poll']
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
      videoId: {
        type: String,
        required: function(this: IContent) {
          return this.type === 'video';
        }
      },
      url: String,
      thumbnail: String,
      duration: String,
      title: String
    },
    gallery: {
      images: [String]
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
  }
}, {
  timestamps: true,
  collection: 'contents'
});

// Add a pre-save middleware to validate video content
ContentSchema.pre('save', function(this: IContent, next) {
  if (this.type === 'video' && (!this.mediaContent?.video?.videoId)) {
    next(new Error('Video content requires a videoId'));
  }
  next();
});

// Add compound index for efficient queries
ContentSchema.index({ type: 1, tier: 1, createdAt: -1 });

// Check if model exists before creating
const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;