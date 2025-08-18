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
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">MVP "棱镜之心" 正在构建中...</h3>
            <div className="text-sm text-gray-400">
              <p>🔮 信念系统</p>
              <p>🤖 NPC代理核心</p>
              <p>🪞 回响之室</p>
              <p>🎭 导演引擎</p>
            </div>
          </div>
          
          <div className="mt-8 space-x-4">
            <a 
              href="/game" 
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all transform hover:scale-105 font-semibold text-lg"
            >
              🎮 进入游戏
            </a>
            <a 
              href="/ethan" 
              className="inline-block px-6 py-3 bg-purple-600/50 hover:bg-purple-700/50 rounded-lg transition-colors"
            >
              Visit Ethan's Branch Preview
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}