/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enable static exports
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: "",
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig;
