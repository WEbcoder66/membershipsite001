import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUser extends Document {
  email: string;
  hashedPassword: string;
  membershipTier?: 'basic' | 'premium' | 'allAccess';
  purchases: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true, required: true },
  hashedPassword: { type: String, required: true },
  membershipTier: { type: String, enum: ['basic', 'premium', 'allAccess'] },
  purchases: { type: [String], default: [] },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.hashedPassword);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
