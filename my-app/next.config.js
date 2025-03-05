/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "https://text2sql-backend.onrender.com/api/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
