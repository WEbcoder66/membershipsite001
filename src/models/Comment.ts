// src/models/Comment.ts
import mongoose, { Document } from 'mongoose';

interface IComment extends Document {
  contentId: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  createdAt: Date;
  parentCommentId?: string;
}

const CommentSchema = new mongoose.Schema<IComment>({
  contentId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  text: { type: String, required: true },
  parentCommentId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

CommentSchema.index({ contentId: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
export default Comment;
