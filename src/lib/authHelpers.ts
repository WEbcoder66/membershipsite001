import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User, { IUserDocument } from '@/models/User';

export function getUserFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserData() {
  const decoded = getUserFromToken();
  if (!decoded) return null;

  await dbConnect();
  const user = await User.findById(decoded.userId) as IUserDocument | null;
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    membershipTier: user.membershipTier || null,
  };
}
