export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Helios
          </h1>
          <h2 className="text-2xl mb-6 text-blue-200">
            赫利俄斯 - 意识的棱镜
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-12 text-gray-300 leading-relaxed">
            这不是一个传统的游戏，而是一个意识探索与演化的沙盒。
            <br />
            你的意识之光将通过独特的信念系统折射，创造属于你的主观现实。
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-4">MVP "棱镜之心" 正在构建中...</h3>
            <div className="text-sm text-gray-400">
              <p>🔮 信念系统</p>
              <p>🤖 NPC代理核心</p>
              <p>🪞 回响之室</p>
              <p>🎭 导演引擎</p>
            </div>
          </div>
          
          {/* 聊天功能入口 */}
          <div className="mt-8 space-y-4">
            <a 
              href="/chat" 
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              💬 体验 AI 聊天助手
            </a>
            <div className="text-sm text-gray-400">
              <p>🌐 直接访问：<code className="bg-gray-800 px-2 py-1 rounded">http://localhost:3000/chat</code></p>
              <p>🚀 服务器状态：运行中</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}