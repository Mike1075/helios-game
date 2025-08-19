import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helios - 本我之境',
  description: '2035年新弧光城 - 人机共生时代的意识探索之旅',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}