'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MembershipTier } from '@/lib/types';

interface PaymentButtonProps {
  price: number;
  name: string;
  contentId?: string;
  type?: 'payment' | 'subscription';
  className?: string;
}

export function PaymentButton({ 
  price, 
  name, 
  contentId,
  type = 'payment',
  className = "bg-yellow-400 px-4 py-2 rounded-md font-semibold text-black hover:bg-yellow-500 transition-colors"
}: PaymentButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handlePayment = async () => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // Mock payment process
    const confirmed = window.confirm(`Demo Purchase: ${name} for $${price}`);
    
    if (confirmed) {
      // Since we no longer have setMembershipTier or such from AuthContext,
      // you'd make an API call to update the user’s membership if needed
      // and then reload or refresh session.
      // For now, just alert success.
      alert('Demo purchase successful! Access should now be granted.');
      window.location.reload();
    }
  };

  return (
    <button 
      onClick={handlePayment}
      className={className}
    >
      {session?.user ? `${type === 'subscription' ? 'Subscribe' : 'Buy'} for $${price}` : 'Sign in to Purchase'}
    </button>
  );
}

export default PaymentButton;
