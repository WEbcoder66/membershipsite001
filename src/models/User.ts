// src/models/User.ts
import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  email: string;
  username: string;
  hashedPassword: string;
  membershipTier?: 'basic' | 'premium' | 'allAccess';
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  purchases: string[];
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUserDocument>({
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  hashedPassword: { type: String, required: true },
  membershipTier: { type: String, enum: ['basic', 'premium', 'allAccess'] },
  passwordResetToken: String,
  passwordResetExpires: Date,
  purchases: [{ type: String, default: [] }]
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.hashedPassword);
};

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
export default User;
