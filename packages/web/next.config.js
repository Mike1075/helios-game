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
  // 静态导出模式，避免serverless函数冲突
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig