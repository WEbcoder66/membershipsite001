import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) {
    // For security, we don't reveal if the user exists or not
    return NextResponse.json({ success: true, message: 'If an account exists, a reset email was sent.' });
  }

  // Generate password reset token
  const token = Math.random().toString(36).substr(2); // Simple token for demo
  const resetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
  user.passwordResetToken = token;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // Send email (ensure your SMTP is configured correctly)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const resetLink = `https://your-site.com/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: '"Your Site" <no-reply@yoursite.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `Click here to reset your password: ${resetLink}`,
      html: `<p>Click here to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'If an account exists, a reset email was sent.' });
}
