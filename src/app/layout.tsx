// src/app/layout.tsx
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Import the client provider wrapper
import { ClientProviders } from './ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Membership Platform',
  description: 'A custom membership platform for content creators',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link 
          rel="preconnect" 
          href="https://cdnjs.cloudflare.com" 
          crossOrigin="anonymous" 
        />
      </head>
      <body>
        {/* Wrap children with the ClientProviders */}
        <ClientProviders>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
