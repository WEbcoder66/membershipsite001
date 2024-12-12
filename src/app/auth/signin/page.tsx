'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    });
    if (res && !res.error) {
      // Signed in successfully
      window.location.href = '/'; // or redirect to desired page
    } else {
      alert(res?.error);
    }
  }

  return (
    <div className="p-6">
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border p-2"/>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border p-2"/>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Sign In</button>
      </form>
    </div>
  );
}
