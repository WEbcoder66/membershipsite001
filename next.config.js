/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'my-site-uploads.nyc3.digitaloceanspaces.com' // Add your DigitalOcean Spaces domain here
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
  },
  // Enable static exports if needed
  // output: 'export',

  // Server configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: process.env.MY_SECRET,
  },

  // Both client and server
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },

  // Customize webpack config if needed
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Perform customizations to webpack config here
    
    // Important: return the modified config
    return config;
  },

  // Enable React strict mode for development
  reactStrictMode: true,

  // Customize page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Disable x-powered-by header
  poweredByHeader: false,

  // Custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: true,
      },
    ];
  },

  // Enable experimental features as needed
  experimental: {
    // Remove appDir as it's now default in Next.js 14
    // Enable other experimental features as needed
    // serverActions: true,
    // instrumentationHook: true,
  },
};

module.exports = nextConfig;
