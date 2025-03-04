/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: ".next",
  assetPrefix: "/",
  basePath: "",
};

module.exports = nextConfig;
