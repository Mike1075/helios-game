export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 游戏标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            赫利俄斯 - 意识的棱镜
          </h1>
          <p className="text-lg text-amber-200">
            新弧光城 · 港口酒馆
          </p>
        </div>
        
        {/* 游戏主界面 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* 左侧：场景描述 */}
          <div className="lg:col-span-1">
            <div className="bg-amber-900/30 backdrop-blur-sm rounded-lg p-6 border border-amber-600/30">
              <h3 className="text-xl font-bold mb-4 text-amber-300">🏛️ 港口酒馆</h3>
              <p className="text-amber-100 leading-relaxed mb-4">
                夕阳西下，新弧光城的港口酒馆里弥漫着海盐的味道。几位常客围坐在吧台前，
                各自怀着不同的心思。这里是信念交汇的地方，也是故事开始的地方。
              </p>
              <div className="text-sm text-amber-200">
                <p>🌅 时间：黄昏时分</p>
                <p>🌊 地点：港口酒馆</p>
                <p>👥 在场：3位NPC，等待玩家加入</p>
              </div>
            </div>
          </div>

          {/* 中间：NPC角色列表 */}
          <div className="lg:col-span-1">
            <div className="bg-orange-900/30 backdrop-blur-sm rounded-lg p-6 border border-orange-600/30">
              <h3 className="text-xl font-bold mb-4 text-orange-300">🤖 在场角色</h3>
              <div className="space-y-4">
                
                {/* NPC 1: 艾克斯 */}
                <div className="bg-orange-800/40 rounded-lg p-4 cursor-pointer hover:bg-orange-800/60 transition-colors">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-orange-200">艾克斯</h4>
                  </div>
                  <p className="text-sm text-orange-300">数据分析师</p>
                  <p className="text-xs text-orange-400 mt-1">
                    "数据不会说谎，但人会。"
                  </p>
                </div>

                {/* NPC 2: 莉亚 */}
                <div className="bg-orange-800/40 rounded-lg p-4 cursor-pointer hover:bg-orange-800/60 transition-colors">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-orange-200">莉亚</h4>
                  </div>
                  <p className="text-sm text-orange-300">酒馆老板娘</p>
                  <p className="text-xs text-orange-400 mt-1">
                    "每个人心里都有故事。"
                  </p>
                </div>

                {/* NPC 3: 卡尔 */}
                <div className="bg-orange-800/40 rounded-lg p-4 cursor-pointer hover:bg-orange-800/60 transition-colors">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-orange-200">卡尔</h4>
                  </div>
                  <p className="text-sm text-orange-300">退役船长</p>
                  <p className="text-xs text-orange-400 mt-1">
                    "海上的规则和陆地不同。"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：聊天界面 */}
          <div className="lg:col-span-1">
            <div className="bg-red-900/30 backdrop-blur-sm rounded-lg p-6 border border-red-600/30 h-[500px] flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-red-300">💬 对话</h3>
              
              {/* 聊天记录区域 */}
              <div className="flex-1 bg-black/20 rounded-lg p-4 mb-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="text-sm text-gray-400 text-center">
                    选择一个角色开始对话...
                  </div>
                </div>
              </div>

              {/* 输入区域 */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="输入您的话语..."
                  className="flex-1 bg-black/30 border border-red-600/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  disabled
                />
                <button 
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  disabled
                >
                  发送
                </button>
              </div>
              
              <p className="text-xs text-red-400 mt-2 text-center">
                🚧 聊天功能开发中...
              </p>
            </div>
          </div>
        </div>

        {/* 底部：系统状态 */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-400">
                🎮 Helios MVP v0.1 - 港口酒馆场景
              </div>
              <div className="text-gray-400">
                🔄 开发分支: feature/yuhan/personal-preview
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </main>
  )
}