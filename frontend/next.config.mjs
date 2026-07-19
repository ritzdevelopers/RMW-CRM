/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:8080';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * Proxy API through the frontend origin so auth cookies are first-party.
   * Production: set API_PROXY_TARGET=https://rmw-crm-1.onrender.com on Vercel
   * and NEXT_PUBLIC_API_URL=/api/v1
   */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyTarget.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
