/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy GoGiver API calls to Flask backend (zero CORS)
  async rewrites() {
    return [
      {
        source: '/api/gogiver/:path*',
        destination: `${process.env.BACKEND_URL || 'https://api.convert4u.my'}/api/gogive/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
