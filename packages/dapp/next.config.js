/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rainbow-me/rainbowkit'],
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit'],
  },
};

module.exports = nextConfig;
