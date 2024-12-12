// src/app/api/user/updateTier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Type definition for expected body shape
interface UpdateTierBody {
  tier: 'basic' | 'premium' | 'allAccess';
}

// POST /api/user/updateTier
// Body: { tier: "basic" | "premium" | "allAccess" }
export async function POST(req: NextRequest) {
  try {
    // Check user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as Partial<UpdateTierBody>;
    const { tier } = body;

    if (!tier || !['basic', 'premium', 'allAccess'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    await dbConnect();

    // Find the user in the database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update membership tier
    user.membershipTier = tier;
    await user.save();

    return NextResponse.json({ success: true, membershipTier: tier }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating tier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
