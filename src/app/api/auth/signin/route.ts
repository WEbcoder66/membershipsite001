import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  await dbConnect();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  const response = NextResponse.json({ success: true });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: true,
    path: '/',
    maxAge: 3600
  });
  return response;
}
