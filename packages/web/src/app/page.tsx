export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            钰涵的分支预览页面
          </h1>
          <h2 className="text-2xl mb-6 text-blue-200">
            Helios - 赫利俄斯项目
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-12 text-gray-300 leading-relaxed">
            这是钰涵的个人开发分支预览页面
            <br />
            分支名称: feature/yuhan/personal-preview
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">🎯 个人分支信息</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>👤 开发者: 钰涵</p>
              <p>🌿 分支: feature/yuhan/personal-preview</p>
              <p>📅 创建时间: 2025年8月17日</p>
              <p>🚀 状态: 预览环境运行中</p>
              <p>🔄 最后更新: {new Date().toLocaleString('zh-CN')}</p>
            </div>
          </div>

          <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="text-green-400 font-semibold mb-2">✅ 协作流程验证成功</h4>
            <p className="text-sm text-green-300">
              按照项目协作开发说明书创建的个人分支预览页面，
              Vercel自动部署功能正常运行！
            </p>
          </div>

          <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="text-blue-400 font-semibold mb-4">🎮 钰涵的Helios MVP构想</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-purple-500/10 p-4 rounded">
                <h5 className="text-purple-300 font-semibold mb-2">🧠 信念系统</h5>
                <p className="text-gray-300">探索玩家内在信念的动态发现机制</p>
              </div>
              <div className="bg-pink-500/10 p-4 rounded">
                <h5 className="text-pink-300 font-semibold mb-2">🤖 AI角色</h5>
                <p className="text-gray-300">具有三层意识结构的智能NPC</p>
              </div>
              <div className="bg-cyan-500/10 p-4 rounded">
                <h5 className="text-cyan-300 font-semibold mb-2">🪞 回响之室</h5>
                <p className="text-gray-300">认知失调时的内省与顿悟空间</p>
              </div>
              <div className="bg-yellow-500/10 p-4 rounded">
                <h5 className="text-yellow-300 font-semibold mb-2">🎭 叙事网络</h5>
                <p className="text-gray-300">基于行为的动态故事生成</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}