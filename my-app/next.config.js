/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: "",
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
