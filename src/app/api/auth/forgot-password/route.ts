import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

  const resetURL = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`;

  // Setup mailer (configure SMTP or a service like SendGrid)
  // For now, just console.log:
  console.log(`Password reset link: ${resetURL}`);

  return NextResponse.json({ success: true });
}
