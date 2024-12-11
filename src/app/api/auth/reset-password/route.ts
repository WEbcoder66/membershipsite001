import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  await dbConnect();
  const { token, newPassword } = await req.json();

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  user.hashedPassword = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return NextResponse.json({ success: true });
}
