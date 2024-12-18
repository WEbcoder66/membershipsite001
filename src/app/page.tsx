'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Feed from '@/components/Feed/Feed';
import AboutContent from '@/components/AboutContent';
import MembershipTiers from '@/components/MembershipTiers';
import { useSession, signOut } from 'next-auth/react';

async function fetchCounts() {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    return { subscriberCount: 0, postCount: 0, hideSubscriberCount: false };
  }
  const data = await res.json();
  return data;
}

const TABS = ['home', 'about', 'membership'] as const;
type TabId = typeof TABS[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showWelcome, setShowWelcome] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [postCount, setPostCount] = useState<number>(0);
  const [hideSubscriberCount, setHideSubscriberCount] = useState<boolean>(false);

  useEffect(() => {
    const shouldShowMembership = localStorage.getItem('returnToMembership');
    if (shouldShowMembership) {
      localStorage.removeItem('returnToMembership');
      setActiveTab('membership');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { subscriberCount, postCount, hideSubscriberCount } = await fetchCounts();
      setSubscriberCount(subscriberCount);
      setPostCount(postCount);
      setHideSubscriberCount(hideSubscriberCount);
    }, 10000);

    (async () => {
      const { subscriberCount, postCount, hideSubscriberCount } = await fetchCounts();
      setSubscriberCount(subscriberCount);
      setPostCount(postCount);
      setHideSubscriberCount(hideSubscriberCount);
    })();

    return () => clearInterval(interval);
  }, []);

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'home' || tab === 'about' || tab === 'membership') {
      setActiveTab(tab as TabId);
    }
  };

  const handleJoinNowClick = () => {
    handleSetActiveTab('membership');
    setTimeout(() => {
      const membershipSection = document.getElementById('membership-section');
      if (membershipSection) {
        const offset = membershipSection.offsetTop - (window.innerHeight / 4);
        window.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="relative h-64 bg-gray-800 overflow-hidden">
        <Image 
          src="/images/banners/banner.jpg"
          alt="Site Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex justify-between items-center p-4">
          <div className="text-xl font-bold text-white">[Your Super Dope Logo here]</div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white">Welcome, {user.name}</span>
                {user.membershipTier && (
                  <span className="px-2 py-1 bg-yellow-400/20 rounded-full text-sm font-medium text-white">
                    {user.membershipTier}
                  </span>
                )}
                <a
                  href="/auth/profile"
                  className="bg-yellow-400 px-4 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
                >
                  Profile
                </a>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-yellow-400 px-4 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-yellow-400 px-4 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="relative -mt-20 text-center px-4">
        <div className="w-40 h-40 mx-auto bg-white rounded-full overflow-hidden border-4 border-white relative">
          <Image 
            src="/images/profiles/profile.jpg"
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Super dope membership site</h1>
        <p className="mt-2 text-gray-600">This can be your membership site!</p>
        <p className="mt-2 text-gray-700 font-medium">
          {hideSubscriberCount ? '' : `${subscriberCount} subscribers · `}{postCount} posts
        </p>
        
        {!user && (
          <button 
            onClick={handleJoinNowClick}
            className="mt-4 bg-yellow-400 px-8 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
          >
            Join Now
          </button>
        )}
      </div>

      <nav className="mt-8 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-8">
            {TABS.map((tab) => (
              <button 
                key={tab}
                onClick={() => handleSetActiveTab(tab)}
                className={`py-4 font-semibold transition-colors ${
                  activeTab === tab 
                    ? 'border-b-2 border-black text-gray-900' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="py-8">
        {showWelcome && user?.membershipTier && (
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-800">
                Welcome to {user.membershipTier} Membership!
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                You now have access to all {user.membershipTier} tier content and features.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ErrorBoundary
          fallback={
            <div className="max-w-4xl mx-auto px-4 py-8">
              <Alert variant="destructive">
                <AlertDescription>
                  Something went wrong while loading the content. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            </div>
          }
        >
          {activeTab === 'home' && <Feed setActiveTab={handleSetActiveTab} />}
          {activeTab === 'about' && <AboutContent />}
          {activeTab === 'membership' && <MembershipTiers onSubscribe={() => setShowWelcome(true)} />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
