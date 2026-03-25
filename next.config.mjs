/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'https://globus-engineering-crm-backend.vercel.app'}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
