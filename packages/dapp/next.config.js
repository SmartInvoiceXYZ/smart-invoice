/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@smartinvoicexyz/constants',
    '@smartinvoicexyz/forms',
    '@smartinvoicexyz/graphql',
    '@smartinvoicexyz/hooks',
    '@smartinvoicexyz/types',
    '@smartinvoicexyz/ui',
    '@smartinvoicexyz/utils',
  ],
  experimental: {},
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
