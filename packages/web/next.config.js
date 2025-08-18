/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Monorepo配置
  experimental: {
    externalDir: true,
  },
  // 禁用开发工具和性能监控面板
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 禁用Web Vitals监控面板
  devIndicators: {
    buildActivity: false,
  },
}

module.exports = nextConfig