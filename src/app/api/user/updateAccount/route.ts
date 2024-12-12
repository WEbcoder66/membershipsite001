// src/app/api/user/updateAccount/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, password } = await req.json();
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  user.username = username;
  if (password) {
    user.hashedPassword = await bcrypt.hash(password, 10);
  }
  await user.save();

  return NextResponse.json({ success: true, message: 'Account updated successfully' }, { status: 200 });
}
