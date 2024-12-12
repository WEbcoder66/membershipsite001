// src/app/ClientProviders.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
