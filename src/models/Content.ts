// src/models/Content.ts
import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['video', 'image', 'gallery', 'audio', 'poll']
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
  tier: {
    type: String,
    required: true,
    enum: ['basic', 'premium', 'allAccess']
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  mediaContent: {
    video: {
      url: String,
      thumbnail: String,
      duration: String,
      title: String
    }
  },
  tags: [String],
  category: String
});

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);