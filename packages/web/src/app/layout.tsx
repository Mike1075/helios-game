import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helios - 意识的棱镜',
  description: '一个意识探索与演化的沙盒世界',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-white">{children}</body>
    </html>
  )
}