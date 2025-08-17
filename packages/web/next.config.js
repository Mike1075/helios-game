/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 明确指定输出目录
  distDir: '.next',
  // 确保 Vercel 能够找到构建输出
  output: 'standalone',
}

module.exports = nextConfig
