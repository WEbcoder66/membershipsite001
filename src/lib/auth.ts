import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export const signIn = async (provider?: string) => {
  try {
    await nextAuthSignIn(provider || 'google', {
      callbackUrl: '/'
    });
  } catch (error) {
    console.error('SignIn error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await nextAuthSignOut({ callbackUrl: '/' });
  } catch (error) {
    console.error('SignOut error:', error);
    throw error;
  }
};

// You can add more authentication-related functions here as needed
export const isAuthenticated = (session: any) => {
  return Boolean(session?.user);
};

export const getAuthRedirectUrl = (returnUrl?: string) => {
  return returnUrl || '/';
};