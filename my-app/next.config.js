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
  // Disable automatic static optimization for the databases page
  unstable_runtimeJS: true,
};

module.exports = nextConfig;
