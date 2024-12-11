import { NextResponse } from 'next/server';
import crypto from 'crypto';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  await dbConnect();
  const { email } = await req.json();
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user doesn't exist
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 3600000); // 1h
  await user.save();

  // Email sending skipped, just console.log for now
  console.log(`Password reset link: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`);

  return NextResponse.json({ success: true });
}
