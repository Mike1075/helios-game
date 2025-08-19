/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
  // 增加服务器端超时时间
  serverRuntimeConfig: {
    timeout: 30000, // 30秒超时
  },
  // 增加API路由超时
  experimental: {
    proxyTimeout: 30000, // 30秒代理超时
  },
}

module.exports = nextConfig