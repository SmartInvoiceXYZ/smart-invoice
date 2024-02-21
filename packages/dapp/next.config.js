/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rainbow-me/rainbowkit'],
  experimental: {
    optimizePackageImports: [
      '@chakra-ui/react',
      '@rainbow-me/rainbowkit',
      '@smart-invoice/constants',
      '@smart-invoice/forms',
      '@smart-invoice/graphql',
      '@smart-invoice/hooks',
      '@smart-invoice/types',
      '@smart-invoice/ui',
      '@smart-invoice/utils',
      'viem',
      'wagmi',
    ],
  },
};

module.exports = nextConfig;
