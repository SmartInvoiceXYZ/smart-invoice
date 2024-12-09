/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GETFORM_URL: process.env.GETFORM_URL
  }
};

module.exports = nextConfig;
