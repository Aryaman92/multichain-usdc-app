/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @wagmi/core's Tempo wallet connector does a dynamic, genuinely optional
    // import('accounts') marked `turbopackOptional`, which Turbopack skips
    // but plain webpack tries to statically resolve and fails on, since
    // 'accounts' isn't a real installable package. This app doesn't use
    // the Tempo connector, so it's safe to alias it away entirely.
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: false,
    };
    return config;
  },
};

export default nextConfig;
