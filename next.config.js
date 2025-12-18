/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Настройка для cheerio на сервере Vercel
      config.externals = config.externals || []
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  // Настройка для работы cheerio в serverless функциях
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
}

module.exports = nextConfig

