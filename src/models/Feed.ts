import mongoose, { Document, Model } from 'mongoose';

interface IFeed extends Document {
  postId: string;
  createdAt: Date;
}

const FeedSchema = new mongoose.Schema<IFeed>({
  postId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Feed: Model<IFeed> = mongoose.models.Feed || mongoose.model<IFeed>('Feed', FeedSchema);

export default Feed;
