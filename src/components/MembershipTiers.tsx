import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

const MEMBERSHIP_TIERS = {
  basic: {
    name: 'Basic',
    price: 4.99,
    features: [
      "Access to weekly content updates",
      "Basic community features",
      "Members-only newsletter",
      "Early announcements"
    ],
    color: 'bg-yellow-200'
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    features: [
      "All Basic features",
      "Exclusive premium content",
      "Priority support",
      "Monthly live sessions",
      "Special member events"
    ],
    color: 'bg-yellow-400'
  },
  allAccess: {
    name: 'All-Access',
    price: 19.99,
    features: [
      "All Premium features",
      "1-on-1 monthly mentoring",
      "Custom content requests",
      "Behind-the-scenes access",
      "Exclusive discord channel"
    ],
    color: 'bg-yellow-500'
  }
};

interface MembershipTiersProps {
  onSubscribe?: () => void;
}

export default function MembershipTiers({ onSubscribe }: MembershipTiersProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setProcessingTier(tierId);
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Make API call to update tier if needed
      onSubscribe?.();
      window.location.reload();
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error subscribing to tier. Please try again.');
    } finally {
      setProcessingTier(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Just show Monthly label */}
      <div className="text-center mb-12">
        <h2 className="text-xl font-semibold text-black">Monthly</h2>
      </div>

      {/* Membership Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {Object.entries(MEMBERSHIP_TIERS).map(([tierId, tier]) => {
          const price = tier.price;

          return (
            <div
              key={tierId}
              className="rounded-lg p-6 bg-white border border-gray-200 shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full ${tier.color}`} />
                <div>
                  <h3 className="text-xl font-bold text-black">{tier.name}</h3>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">${price.toFixed(2)}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tierId)}
                disabled={user?.membershipTier === tierId || !!processingTier}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  user?.membershipTier === tierId
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : processingTier === tierId
                    ? 'bg-yellow-300 text-black cursor-wait'
                    : `${tier.color} text-black hover:bg-opacity-90`
                }`}
              >
                {user?.membershipTier === tierId
                  ? 'Current Plan'
                  : processingTier === tierId
                  ? 'Processing...'
                  : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
