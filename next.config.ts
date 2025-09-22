/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ ESLint errors won’t block build
  },
};

module.exports = nextConfig;
