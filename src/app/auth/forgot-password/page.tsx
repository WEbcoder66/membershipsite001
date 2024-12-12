'use client';

import { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';

// In a real app, you'd have logic to handle password reset links, emails, etc.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Implement your forgot password logic, e.g. send reset link via email.
    alert('If an account with that email exists, a reset link has been sent.');
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
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-sm text-gray-600 mt-2">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input 
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)} 
              type="email" 
              placeholder="you@example.com" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{' '}
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
