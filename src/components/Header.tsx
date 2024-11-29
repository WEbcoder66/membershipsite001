'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function Header() {  // Changed to named export
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-yellow-600 hover:text-yellow-700">
          ← Back to Home
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-yellow-600 hover:text-yellow-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;  // Also add default export for flexibility