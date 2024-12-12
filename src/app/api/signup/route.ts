// src/app/api/signup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

/**
 * Handles user signup:
 * - Validates input
 * - Checks if user already exists
 * - Hashes password
 * - Creates new user in MongoDB
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with that email already exists.' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: name,
      email,
      hashedPassword,
      membershipTier: 'basic',
      purchases: []
    });

    await newUser.save();

    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
