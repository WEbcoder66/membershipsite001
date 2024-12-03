// src/lib/auth.ts
import { NextRequest } from 'next/server';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateAdmin = async (req: NextRequest): Promise<ValidationResult> => {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        isValid: false,
        message: 'Missing or invalid authorization header'
      };
    }

    const userEmail = authHeader.split('Bearer ')[1];

    // Check if it matches the admin email from environment variables
    if (userEmail !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return {
        isValid: false,
        message: 'Unauthorized - Admin access required'
      };
    }

    return {
      isValid: true
    };

  } catch (error) {
    console.error('Auth validation error:', error);
    return {
      isValid: false,
      message: 'Authentication failed'
    };
  }
};