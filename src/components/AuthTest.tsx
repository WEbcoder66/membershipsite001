'use client';

import { useSession } from 'next-auth/react';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export default function AuthTest() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div>
        Signed in as {session.user?.email} <br />
        <button 
          onClick={() => nextAuthSignOut()}
          className="text-blue-500 hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => nextAuthSignIn('google')}
      className="text-blue-500 hover:underline"
    >
      Sign in
    </button>
  );
}