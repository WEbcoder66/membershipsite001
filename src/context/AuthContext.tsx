// src/context/AuthContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MembershipTier } from '@/lib/types';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membershipTier?: MembershipTier;
  isAdmin?: boolean;
  joinedAt: string;
  purchases: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  setMembershipTier: (tier: MembershipTier) => void;
  addPurchase: (contentId: string) => void;
  hasPurchased: (contentId: string) => boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('demoUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('demoUser', JSON.stringify(user));
    }
  }, [user]);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Check if this is an admin account
      const isAdmin = email.toLowerCase().includes('admin');

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email,
        isAdmin,
        joinedAt: new Date().toISOString(),
        purchases: [],
        avatar: '/images/profiles/default.jpg'
      };

      setUser(newUser);
      localStorage.setItem('demoUser', JSON.stringify(newUser));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (name.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if this is an admin account
      const isAdmin = email.toLowerCase().includes('admin');

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        isAdmin,
        joinedAt: new Date().toISOString(),
        purchases: [],
        avatar: '/images/profiles/default.jpg'
      };

      setUser(newUser);
      localStorage.setItem('demoUser', JSON.stringify(newUser));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('demoUser');
  };

  const setMembershipTier = (tier: MembershipTier) => {
    if (user) {
      const updatedUser = { ...user, membershipTier: tier };
      setUser(updatedUser);
      localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    }
  };

  const addPurchase = (contentId: string) => {
    if (user && !user.purchases.includes(contentId)) {
      const updatedUser = {
        ...user,
        purchases: [...user.purchases, contentId],
      };
      setUser(updatedUser);
      localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    }
  };

  const hasPurchased = (contentId: string) => {
    return user?.purchases.includes(contentId) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        setMembershipTier,
        addPurchase,
        hasPurchased,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}