export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Helios
          </h1>
          <h2 className="text-2xl mb-6 text-blue-200">
            赫利俄斯 - 本我之境
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-12 text-gray-300 leading-relaxed">
            这不是一个传统的游戏，而是一个意识探索与演化的沙盒。
            <br />
            你的意识之光将通过独特的信念系统折射，创造属于你的主观现实。
          </p>
          
          <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-green-400/30">
            <h3 className="text-2xl font-bold mb-4 text-green-300">🌟 陶子的分支预览页面 🌟</h3>
            <p className="text-lg text-green-200 mb-6">欢迎来到陶子的开发分支！</p>
            <div className="text-sm text-gray-300">
              <p>📍 当前分支: taozi-branch</p>
              <p>👤 开发者: 陶子</p>
              <p>🚀 状态: 活跃开发中</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto mt-8">
            <h3 className="text-lg font-semibold mb-4">MVP "棱镜之心" 正在构建中...</h3>
            <div className="text-sm text-gray-400">
              <p>🔮 信念系统</p>
              <p>🤖 NPC代理核心</p>
              <p>🪞 回响之室</p>
              <p>🎭 导演引擎</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}