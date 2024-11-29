/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Remove appDir as it's now default in Next.js 14
    // Other experimental features can go here if needed
  },
};

module.exports = nextConfig;