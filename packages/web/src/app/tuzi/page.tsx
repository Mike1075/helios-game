export default function TuziPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            tuzi 的分支预览页面
          </h1>
          <h2 className="text-2xl mb-6 text-teal-200">
            🐰 Helios 项目开发者 - tuzi
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-300 leading-relaxed">
            欢迎来到我的个人开发分支！
            <br />
            这里是我在 Helios 项目中的实验与创作空间。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-emerald-300">🔧 当前开发状态</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>✅ 协作流程配置完成</p>
                <p>✅ Fork 工作流建立</p>
                <p>✅ Vercel 预览部署就绪</p>
                <p>🔄 学习最新 PRD 1.2 架构</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-teal-300">🎯 理解的核心概念</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>🪞 本我之镜：信念的映照</p>
                <p>🌱 涌现式信念系统</p>
                <p>🔄 意识探索与演化</p>
                <p>⚡ 事件驱动的时间流</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">📋 项目理解摘要</h3>
            <div className="text-left text-sm text-gray-200 space-y-3">
              <p><strong>核心哲学：</strong>不预设信念，而是发现信念。游戏是意识的镜子。</p>
              <p><strong>技术架构：</strong>Vercel + Supabase + Zep + AI Gateway 的现代化栈。</p>
              <p><strong>协作模式：</strong>分支开发 → PR → Vercel 预览 → 合并的标准流程。</p>
              <p><strong>验收目标：</strong>信念涌现、主观归因、社会生态的完整验证。</p>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <p>分支：feature/tuzi/personal-page</p>
            <p>最后更新：{new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </div>
    </main>
  )
} 