import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export function getUserFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { userId: string; };
  } catch {
    return null;
  }
}
