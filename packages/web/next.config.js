/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Monorepo配置
  experimental: {
    externalDir: true,
  },
  // 修复monorepo文件追踪
  outputFileTracingRoot: '../../',
}

module.exports = nextConfig