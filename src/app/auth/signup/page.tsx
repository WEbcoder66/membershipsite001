'use client';

import { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Changed from name to username
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'An error occurred during signup.');
      } else {
        // Automatically sign in the user
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (signInRes && !signInRes.error) {
          window.location.href = '/';
        } else {
          alert('Account created but sign-in failed, please sign in manually.');
          window.location.href = '/auth/signin';
        }
      }
    } catch (err: any) {
      console.error('Signup error on client:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          {/* Removed any top image if it existed; now just the logo */}
          <div className="w-16 h-16 mx-auto relative mb-4">
            <Image
              src="/favicon.ico"
              alt="Site Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sign Up</h1>
          <p className="text-sm text-gray-600 mt-2">Create your account</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-red-700 bg-red-50 rounded-lg border border-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              type="text"
              placeholder="Your Username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              required
            />
          </div>

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

          <button
            type="submit"
            className="w-full py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-yellow-600 hover:text-yellow-700 font-medium">Sign In</Link>
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
