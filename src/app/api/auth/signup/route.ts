import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  await dbConnect();
  const { email, username, password } = await req.json();

  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 });
  }

  const existingUserEmail = await User.findOne({ email });
  if (existingUserEmail) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const existingUserName = await User.findOne({ username });
  if (existingUserName) {
    return NextResponse.json({ error: 'Username already in use' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ email, username, hashedPassword });

  return NextResponse.json({ success: true });
}
