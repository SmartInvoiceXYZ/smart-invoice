/* eslint-disable @typescript-eslint/no-require-imports */
const createBundleAnalyzerPlugin = require('@next/bundle-analyzer');

const {
  VERCEL_ENV = 'development',
  VERCEL_URL,
  VERCEL_GIT_COMMIT_REF,
  VERCEL_PROJECT_PRODUCTION_URL,
} = process.env;

const protocol = VERCEL_ENV === 'development' ? 'http' : 'https';
let url = VERCEL_URL ?? 'localhost:3000';

if (VERCEL_GIT_COMMIT_REF === 'main') {
  url = `app.smartinvoice.xyz`;
} else if (VERCEL_GIT_COMMIT_REF === 'develop') {
  url = `dev.smartinvoice.xyz`;
}

if (VERCEL_ENV === 'production') {
  url = VERCEL_PROJECT_PRODUCTION_URL ?? url;
}

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
    '@farcaster/frame-sdk',
    '@farcaster/frame-wagmi-connector',
  ],
  experimental: {
    optimizePackageImports: [
      '@rainbow-me/rainbowkit',
      '@smartinvoicexyz/ui',
      '@chakra-ui/react',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/api/farcaster',
      },
    ];
  },
  webpack: (config, { webpack }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.plugins.push(
      new webpack.DefinePlugin({
        __SI_BASE_URL__: JSON.stringify(baseUrl),
      }),
    );
    return config;
  },
};

const withBundleAnalyzer = createBundleAnalyzerPlugin({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
