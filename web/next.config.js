/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  }
};
// web/next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'addrevenue.io' },
      { protocol: 'https', hostname: '*.addrevenue.io' },
      { protocol: 'https', hostname: 'api.adrevenue.com' }, // om bilder nånsin kommer härifrån
    ],
  },
};
