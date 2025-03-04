/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  distDir: ".next",
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://text2sql-backend.onrender.com/api/:path*",
      },
    ];
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: require.resolve("tailwindcss"),
      postcss: require.resolve("postcss"),
      autoprefixer: require.resolve("autoprefixer"),
    };
    return config;
  },
};

module.exports = nextConfig;
