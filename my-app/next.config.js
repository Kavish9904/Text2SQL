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
  // Add custom rewrites to handle the edit route
  async rewrites() {
    return [
      {
        source: "/databases/edit/:id",
        destination: "/databases",
      },
    ];
  },
};

module.exports = nextConfig;
