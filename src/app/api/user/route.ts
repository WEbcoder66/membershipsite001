import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/authHelpers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const userToken = getUserFromToken();
  if (!userToken) return NextResponse.json({ loggedIn: false }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userToken.userId).select('email username membershipTier purchases');
  if (!user) return NextResponse.json({ loggedIn: false }, { status: 404 });

  return NextResponse.json({
    loggedIn: true,
    email: user.email,
    username: user.username,
    membershipTier: user.membershipTier,
    purchases: user.purchases // This should now work without errors.
  });
}
