import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Content from '@/models/Content';

export async function GET() {
  await dbConnect();
  
  // Count subscribers: users with tier != 'basic'
  const subscriberCount = await User.countDocuments({ membershipTier: { $ne: 'basic' } });
  
  // Count posts: all Content documents (videos, photos, audio, posts)
  const postCount = await Content.countDocuments({});

  // If you have a condition to hide subscriber count, set hideSubscriberCount as needed
  const hideSubscriberCount = false; 

  return NextResponse.json({ subscriberCount, postCount, hideSubscriberCount });
}
