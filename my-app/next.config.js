/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Remove rewrites since they don't work with static exports
};

module.exports = nextConfig;
