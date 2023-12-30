/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
// next.config.js

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix "fs" module not found issue
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};
