import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  await dbConnect();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await User.create({ email, hashedPassword });

  return NextResponse.json({ success: true });
}
