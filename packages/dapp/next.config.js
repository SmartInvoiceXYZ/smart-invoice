/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rainbow-me/rainbowkit'],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: [
        {
          loader: "file-loader",
          options: {
            outputPath: "static/fonts/",
            publicPath: "/_next/static/fonts/",
            name: "[name].[ext]",
          },
        },
      ],
    });
    return config;
  },
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit'],
  },
};

module.exports = nextConfig;
