/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false,
        crypto: false, stream: false, path: false,
        os: false, http: false, https: false, zlib: false,
        'sodium-native': false, 'require-addon': false,
      };
    }
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
    return config;
  },
};
module.exports = nextConfig;
