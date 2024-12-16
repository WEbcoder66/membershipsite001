import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  console.log('Signup route called.');
  try {
    console.log('Connecting to DB...');
    await dbConnect();
    console.log('DB connected successfully.');

    const { name, email, password } = await request.json();
    console.log('Received data:', { name, email, password: password ? '***' : 'no password' });

    if (!name || !email || !password) {
      console.log('Missing required fields.');
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json({ error: 'User with that email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed.');

    const newUser = new User({
      username: name,
      email,
      hashedPassword,
      membershipTier: 'free', // Make sure this is 'free'
      purchases: []
    });

    console.log('Saving new user to DB...');
    await newUser.save();
    console.log('User saved successfully:', { email });

    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
