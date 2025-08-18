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
      <head>
        {/* 在生产环境中禁用性能监控面板 */}
        {process.env.NODE_ENV === 'production' && (
          <style dangerouslySetInnerHTML={{
            __html: `
              [data-testid*="timing"],
              [class*="timing"],
              [class*="performance"],
              [class*="interaction"],
              [class*="devtools"] {
                display: none !important;
              }
            `
          }} />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}