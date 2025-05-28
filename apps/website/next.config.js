/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GETFORM_URL: process.env.GETFORM_URL,
  },
};

module.exports = nextConfig;
