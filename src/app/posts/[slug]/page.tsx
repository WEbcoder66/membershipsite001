'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { posts } from '@/lib/data';
import { Header } from '@/components/Header';
import { PaymentButton } from '@/components/PaymentButton';

export default function PostPage() {
  const { user } = useAuth();
  const params = useParams();
  const slug = params.slug as string;
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">Post not found</h1>
          <Link 
            href="/"
            className="mt-4 inline-block text-yellow-600 hover:text-yellow-700"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/"
            className="text-yellow-600 hover:text-yellow-700"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img 
            src={post.thumbnailUrl || '/api/placeholder/800/400'}
            alt={post.title}
            className="w-full h-96 object-cover"
          />
          <div className="p-8">
            <h1 className="text-3xl font-bold text-black">{post.title}</h1>
            
            <div className="mt-8 prose max-w-none text-black">
              <p className="text-lg">{post.description}</p>
              
              {post.isLocked ? (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-xl font-semibold">Exclusive Content</h2>
                  <p className="mt-2 text-gray-600">
                    This content is exclusive to {post.tier} members. Unlock now to access the full post!
                  </p>
                  <PaymentButton 
                    price={post.price || 0}
                    name={post.title}
                    contentId={post.id}
                    type="subscription"
                    className="mt-4 bg-yellow-400 px-6 py-2 rounded-md font-semibold text-black hover:bg-yellow-500"
                  />
                </div>
              ) : (
                <div className="mt-8">
                  <p className="text-lg leading-relaxed">{post.content}</p>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}