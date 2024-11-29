// src/lib/adminConfig.ts
export const ADMIN_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@membershipsite001.com',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'default-password'
};