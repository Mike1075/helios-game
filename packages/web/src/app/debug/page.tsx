import Link from 'next/link'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mr-4">
            ← 返回主页
          </Link>
          <h1 className="text-3xl font-bold">调试面板</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 路由测试 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">路由测试</h2>
            <div className="space-y-3">
              <Link 
                href="/chat"
                className="block p-3 bg-blue-600 hover:bg-blue-700 rounded text-center transition-colors"
              >
                测试聊天页面链接
              </Link>
              
              <Link 
                href="/"
                className="block p-3 bg-green-600 hover:bg-green-700 rounded text-center transition-colors"
              >
                返回主页
              </Link>
            </div>
          </div>

          {/* 状态信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">状态信息</h2>
            <div className="space-y-2 text-sm">
              <div>✅ 调试页面加载成功</div>
              <div>✅ Next.js 路由正常</div>
              <div>✅ Tailwind CSS 加载</div>
              <div>📍 当前路径: /debug</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}