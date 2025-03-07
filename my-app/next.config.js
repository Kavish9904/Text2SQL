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
    optimizeCss: false,
  },
  exportPathMap: async function () {
    return {
      "/": { page: "/" },
      "/databases": { page: "/databases" },
      "/connect": { page: "/connect" },
      "/databases/edit/[id]": { page: "/databases/edit/[id]" },
    };
  },
};

module.exports = nextConfig;
