import Link from 'next/link'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link 
              href="/"
              className="mr-4 text-gray-400 hover:text-white transition-colors"
              title="返回主页"
            >
              ← 返回
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Helios Chat
            </h1>
          </div>
          <p className="text-gray-300">与AI对话，体验意识的交流</p>
        </div>

        {/* 简单的聊天界面 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">聊天功能</h2>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-300">✅ 聊天页面已成功加载</p>
              <p className="text-gray-300">🔧 AI聊天功能正在开发中...</p>
            </div>
            
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="输入你的消息..."
                className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200">
                发送
              </button>
            </div>
          </div>
        </div>

        {/* 调试信息 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">页面状态</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <div>✅ Next.js 页面路由正常</div>
            <div>✅ Tailwind CSS 样式加载</div>
            <div>✅ Link 组件导航功能</div>
            <div>📍 当前路径: /chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}