import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/authHelpers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const userToken = getUserFromToken();
  if (!userToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  await dbConnect();
  const { oldPassword, newPassword } = await req.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Old and new passwords required' }, { status: 400 });
  }

  const user = await User.findById(userToken.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
  }

  user.hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.save();

  return NextResponse.json({ success: true });
}
