'use client';
import { useAuth } from '@/context/AuthContext';
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
  const { user, setMembershipTier } = useAuth();
  const router = useRouter();

  const handlePayment = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Mock payment process
    const confirmed = window.confirm(`Demo Purchase: ${name} for $${price}`);
    
    if (confirmed) {
      if (type === 'subscription') {
        setMembershipTier(contentId as MembershipTier || 'basic');
        alert('Demo subscription successful! You now have access to premium content.');
      } else {
        alert('Demo purchase successful! Content is now available.');
      }
    }
  };

  return (
    <button 
      onClick={handlePayment}
      className={className}
    >
      {user ? `${type === 'subscription' ? 'Subscribe' : 'Buy'} for $${price}` : 'Sign in to Purchase'}
    </button>
  );
}

export default PaymentButton;  // Also add default export for flexibility