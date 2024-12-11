import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUserDocument } from '@/models/User';
import { getUserFromToken } from '@/lib/authHelpers';

export async function POST(req: Request) {
  await dbConnect();

  const userToken = getUserFromToken();
  if (!userToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await User.findById(userToken.userId) as IUserDocument | null;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { username, membershipTier } = await req.json();

  if (username) {
    const existingUserName = await User.findOne({ username }) as IUserDocument | null;
    if (existingUserName && existingUserName._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Username already in use' }, { status: 409 });
    }
    user.username = username;
  }

  if (membershipTier && ['basic', 'premium', 'allAccess'].includes(membershipTier)) {
    user.membershipTier = membershipTier;
  }

  await user.save();
  return NextResponse.json({ success: true });
}
