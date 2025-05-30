const {
  VERCEL_ENV = 'development',
  VERCEL_URL,
  VERCEL_PROJECT_PRODUCTION_URL,
} = process.env;

const protocol = VERCEL_ENV === 'development' ? 'http' : 'https';
const url = VERCEL_PROJECT_PRODUCTION_URL ?? VERCEL_URL ?? 'localhost:3000';

const baseUrl = `${protocol}://${url}`;

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
  env: {
    NEXT_PUBLIC_BASE_URL: baseUrl,
  },
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit'],
  },
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
