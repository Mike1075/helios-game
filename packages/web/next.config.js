/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Monorepo配置
  experimental: {
    externalDir: true,
  },
  // outputFileTracingRoot在Next.js 14.2.0中已过时，移除此配置
}

module.exports = nextConfig