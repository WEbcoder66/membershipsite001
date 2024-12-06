import { headers } from 'next/headers';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateAdmin = async (): Promise<ValidationResult> => {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        isValid: false,
        message: 'Missing or invalid authorization header'
      };
    }

    const userEmail = authHeader.split('Bearer ')[1];

    // Check if it matches the admin email from environment variables
    if (!process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      console.error('NEXT_PUBLIC_ADMIN_EMAIL environment variable is not set');
      return {
        isValid: false,
        message: 'Server configuration error'
      };
    }

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

export const isValidBearerToken = (token: string): boolean => {
  try {
    return token.startsWith('Bearer ') && token.length > 7;
  } catch {
    return false;
  }
};

export const extractBearerToken = (token: string): string | null => {
  try {
    if (!isValidBearerToken(token)) return null;
    return token.split('Bearer ')[1];
  } catch {
    return null;
  }
};