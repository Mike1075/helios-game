export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      {/* 精简背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* 简洁标题 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light mb-4 text-white tracking-wide">
            HELIOS
          </h1>
          <p className="text-lg text-gray-300 font-light">
            意识的棱镜
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mt-6"></div>
        </div>
        
        {/* 主要内容区域 */}
        <div className="max-w-6xl mx-auto">
          
          {/* 场景标题 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-200 mb-2">港口酒馆</h2>
            <p className="text-gray-400 text-sm">夜幕降临，意识体们聚集在此...</p>
          </div>

          {/* 核心游戏区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 左侧：意识体选择 */}
            <div className="space-y-6">
              <h3 className="text-xl font-light text-gray-200 mb-6">选择一个意识体对话</h3>
              
              <div className="space-y-4">
                {/* NPC 1: 艾克斯 */}
                <div className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer transition-all duration-300 border border-white/10 hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">艾</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white">艾克斯</h4>
                        <p className="text-sm text-gray-400">数据分析师</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-gray-300 italic">
                    "数据不会说谎，但人会。"
                  </p>
                </div>

                {/* NPC 2: 莉亚 */}
                <div className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer transition-all duration-300 border border-white/10 hover:border-amber-400/30 hover:shadow-xl hover:shadow-amber-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">莉</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white">莉亚</h4>
                        <p className="text-sm text-gray-400">酒馆老板娘</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-gray-300 italic">
                    "每个人心里都有故事。"
                  </p>
                </div>

                {/* NPC 3: 卡尔 */}
                <div className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer transition-all duration-300 border border-white/10 hover:border-green-400/30 hover:shadow-xl hover:shadow-green-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">卡</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white">卡尔</h4>
                        <p className="text-sm text-gray-400">退役船长</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-gray-300 italic">
                    "海上的规则和陆地不同。"
                  </p>
                </div>
              </div>
            </div>

            {/* 右侧：对话区域 */}
            <div className="space-y-6">
              <h3 className="text-xl font-light text-gray-200 mb-6">意识交流</h3>
              
              {/* 对话窗口 */}
              <div className="bg-white/5 rounded-xl border border-white/10 h-[400px] flex flex-col">
                {/* 对话历史 */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">💭</span>
                      </div>
                      <p className="text-gray-400 text-sm">选择一个意识体开始对话</p>
                      <p className="text-gray-500 text-xs">每次交流都是对内在信念的探索</p>
                    </div>
                  </div>
                </div>
                
                {/* 输入区域 */}
                <div className="p-6 border-t border-white/10">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="表达你的想法..."
                      className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                      disabled
                    />
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>

              {/* 回响之室入口 */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">🌀</span>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">回响之室</h4>
                  <p className="text-sm text-gray-400 mb-4">探索内在的因果联系</p>
                  <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg px-6 py-2 text-purple-300 text-sm transition-all duration-300">
                    进入探索
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部：简洁状态条 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6 text-gray-400">
                <span>Helios MVP v0.1</span>
                <span>·</span>
                <span>创世之心</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400 text-sm">系统运行中</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}