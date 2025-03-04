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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      };
    }
    config.resolve.modules = [
      "node_modules",
      "/opt/render/project/src/node_modules",
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: "/opt/render/project/src/node_modules/tailwindcss",
      postcss: "/opt/render/project/src/node_modules/postcss",
      autoprefixer: "/opt/render/project/src/node_modules/autoprefixer",
    };
    return config;
  },
};

module.exports = nextConfig;
