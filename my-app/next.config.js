/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  distDir: "build",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://text2sql-backend.onrender.com/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
