import mongoose from 'mongoose';

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
  }
}, {
  // This tells Mongoose which collection to use
  collection: 'contents'
});

// Check if the model exists before creating it
const Content = mongoose.models.Content || mongoose.model('Content', ContentSchema);
export default Content;