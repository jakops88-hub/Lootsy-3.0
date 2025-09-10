/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // <-- tvingar visning av ALLA externa bilder
  },
};

module.exports = nextConfig;
