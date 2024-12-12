'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    });

    if (res && !res.error) {
      // Signed in successfully
      window.location.href = '/';
    } else {
      setErrorMsg(res?.error ?? 'Failed to sign in');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto relative mb-4">
            <Image
              src="/favicon.ico"
              alt="Site Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sign In</h1>
          <p className="text-sm text-gray-600 mt-2">Access your account</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-red-700 bg-red-50 rounded-lg border border-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="********"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              required
            />
          </div>

          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link href="/auth/signup" className="text-yellow-600 hover:text-yellow-700 font-medium">Sign Up</Link>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
