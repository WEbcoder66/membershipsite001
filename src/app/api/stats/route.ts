import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Content from '@/models/Content';

export async function GET() {
  await dbConnect();
  
  // Count subscribers: users with tier != 'free'
  const subscriberCount = await User.countDocuments({ membershipTier: { $ne: 'free' } });
  
  // Count posts: all Content documents
  const postCount = await Content.countDocuments({});

  const hideSubscriberCount = false; 

  return NextResponse.json({ subscriberCount, postCount, hideSubscriberCount });
}
