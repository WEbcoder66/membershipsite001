// src/app/layout.tsx
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/components/Cart/CartProvider';
import './globals.css';
import { siteConfig } from '@/lib/data';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: [
    'membership site',
    'content creator',
    'digital content',
    'premium content',
    'online community'
  ],
  authors: [
    {
      name: 'Your Name',
      url: 'https://yourwebsite.com',
    },
  ],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-site.com',
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [
      {
        url: siteConfig.bannerImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.bannerImage],
    creator: '@yourhandle',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
        <link 
          rel="preconnect" 
          href="https://cdnjs.cloudflare.com" 
          crossOrigin="anonymous" 
        />
      </head>
      <body className="h-full bg-gray-50">
        <AuthProvider>
          <CartProvider>
            {/* Skip Navigation for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
            >
              Skip to main content
            </a>

            {/* Toast Container for notifications */}
            <div id="toast-container" className="fixed top-4 right-4 z-50" />

            {/* Main Content */}
            <div className="min-h-screen flex flex-col">
              {children}

              {/* Footer */}
              <footer className="mt-auto py-8 bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-4">{siteConfig.title}</h3>
                      <p className="text-gray-600 mb-4">{siteConfig.description}</p>
                      <div className="flex space-x-4">
                        {siteConfig.socialLinks.map(({ platform, url }) => (
                          <a
                            key={platform}
                            href={url}
                            className="text-gray-400 hover:text-gray-500"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="sr-only">{platform}</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              {/* Add social icons paths here */}
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
                      <ul className="space-y-2">
                        {siteConfig.navigation.map(({ label, path }) => (
                          <li key={path}>
                            <a
                              href={path}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">Legal</h4>
                      <ul className="space-y-2">
                        <li>
                          <a
                            href="/privacy"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Privacy Policy
                          </a>
                        </li>
                        <li>
                          <a
                            href="/terms"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Terms of Service
                          </a>
                        </li>
                        <li>
                          <a
                            href="/cookies"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cookie Policy
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-gray-400 text-sm text-center">
                      © {new Date().getFullYear()} {siteConfig.title}. All rights reserved.
                    </p>
                  </div>
                </div>
              </footer>
            </div>

            {/* Modal Container */}
            <div id="modal-root" />
          </CartProvider>
        </AuthProvider>

        {/* Scripts */}
        <script
          defer
          data-domain="your-domain.com"
          src="https://plausible.io/js/script.js"
        />
      </body>
    </html>
  );
}

// Enable edge runtime for better performance
export const runtime = 'edge';

// Disable automatic static optimization for this layout
export const dynamic = 'force-dynamic';

// Revalidate the page every hour
export const revalidate = 3600;