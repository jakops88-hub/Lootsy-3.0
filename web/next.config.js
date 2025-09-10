/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'addrevenue.io' },
      { protocol: 'https', hostname: '*.addrevenue.io' },
      { protocol: 'https', hostname: 'api.adrevenue.com' },
    ],
  },
};

module.exports = nextConfig;
