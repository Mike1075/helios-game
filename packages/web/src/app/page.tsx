export default function Home() {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* 动态背景层 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,179,71,0.2),transparent_50%)]"></div>
      
      {/* 粒子效果模拟 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-20 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* 游戏标题 - 更神秘的设计 */}
        <div className="text-center mb-8">
          <div className="relative">
            <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400 tracking-wider">
              HELIOS
            </h1>
            <div className="text-sm tracking-[0.3em] text-gray-400 mb-4">
              意识的棱镜 · THE MIRROR OF THE SELF
            </div>
            <div className="flex items-center justify-center space-x-2 text-amber-300">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-300"></div>
              <span className="text-xs tracking-wider">新弧光城 · 港口酒馆</span>
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-300"></div>
            </div>
          </div>
        </div>
        
        {/* 游戏主界面 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* 左侧：意识状态面板 */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-blue-500/20 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                意识状态
              </h3>
              
              {/* 场景氛围描述 */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border-l-2 border-blue-400">
                <p className="text-blue-100 leading-relaxed text-sm italic">
                  "夜幕降临，港口酒馆里昏黄的灯光摇曳不定。海风带来远方的呼唤，
                  而每个人心中都藏着不为人知的秘密。在这里，真相与谎言交织，
                  信念在碰撞中显现..."
                </p>
              </div>

              {/* 当前状态 */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🌙 时间流</span>
                  <span className="text-blue-300">夜幕时分</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🏛️ 当前场景</span>
                  <span className="text-purple-300">港口酒馆</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">👥 在场存在</span>
                  <span className="text-amber-300">3个意识体</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🔮 信念张力</span>
                  <span className="text-green-300">稳定</span>
                </div>
              </div>

              {/* 回响之室入口 */}
              <div className="mt-6 pt-4 border-t border-gray-600/30">
                <button className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 rounded-lg p-3 text-purple-300 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="flex items-center justify-center space-x-2">
                    <span>🌀</span>
                    <span>进入回响之室</span>
                  </div>
                  <div className="text-xs text-purple-400 mt-1">探索内在的因果联系</div>
                </button>
              </div>
            </div>
          </div>

          {/* 中间：意识体面板 */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-amber-500/20 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-amber-300 flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-3 animate-pulse"></div>
                在场意识体
              </h3>
              <div className="space-y-4">
                {/* NPC 1: 艾克斯 - 理性分析师 */}
                <div className="group bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg p-4 cursor-pointer hover:from-blue-800/50 hover:to-cyan-800/50 transition-all duration-300 border border-blue-500/20 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="flex items-center mb-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h4 className="font-semibold text-blue-200 ml-3">艾克斯</h4>
                    <div className="ml-auto text-xs text-blue-400 opacity-60 group-hover:opacity-100">数据流</div>
                  </div>
                  <p className="text-sm text-blue-300 mb-2">数据分析师 · 理性主义者</p>
                  <div className="text-xs text-blue-400 italic border-l-2 border-blue-500/30 pl-3">
                    "数据不会说谎，但人会。"
                  </div>
                  <div className="mt-2 text-xs text-blue-500">
                    核心动机：通过数据发现真相
                  </div>
                </div>

                {/* NPC 2: 莉亚 - 温和倾听者 */}
                <div className="group bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg p-4 cursor-pointer hover:from-amber-800/50 hover:to-orange-800/50 transition-all duration-300 border border-amber-500/20 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/20">
                  <div className="flex items-center mb-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h4 className="font-semibold text-amber-200 ml-3">莉亚</h4>
                    <div className="ml-auto text-xs text-amber-400 opacity-60 group-hover:opacity-100">温暖光芒</div>
                  </div>
                  <p className="text-sm text-amber-300 mb-2">酒馆老板娘 · 倾听者</p>
                  <div className="text-xs text-amber-400 italic border-l-2 border-amber-500/30 pl-3">
                    "每个人心里都有故事。"
                  </div>
                  <div className="mt-2 text-xs text-amber-500">
                    核心动机：维护酒馆的和谐氛围
                  </div>
                </div>

                {/* NPC 3: 卡尔 - 豪爽船长 */}
                <div className="group bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-lg p-4 cursor-pointer hover:from-green-800/50 hover:to-teal-800/50 transition-all duration-300 border border-green-500/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-center mb-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h4 className="font-semibold text-green-200 ml-3">卡尔</h4>
                    <div className="ml-auto text-xs text-green-400 opacity-60 group-hover:opacity-100">海风记忆</div>
                  </div>
                  <p className="text-sm text-green-300 mb-2">退役船长 · 经验主义者</p>
                  <div className="text-xs text-green-400 italic border-l-2 border-green-500/30 pl-3">
                    "海上的规则和陆地不同。"
                  </div>
                  <div className="mt-2 text-xs text-green-500">
                    核心动机：寻找人生新的意义
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：意识交流界面 */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-purple-500/20 shadow-2xl h-[600px] flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                意识交流
              </h3>
              
              {/* 交流记录区域 */}
              <div className="flex-1 bg-gradient-to-b from-black/30 to-gray-900/30 rounded-lg p-4 mb-4 overflow-y-auto border border-gray-600/20">
                <div className="space-y-4">
                  {/* 系统欢迎消息 */}
                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg px-4 py-2 border border-blue-500/30">
                      <div className="text-sm text-blue-300 mb-1">✨ 意识连接建立</div>
                      <div className="text-xs text-gray-400">
                        点击任意意识体开始探索...
                      </div>
                    </div>
                  </div>
                  
                  {/* 示例对话气泡 */}
                  <div className="space-y-3 opacity-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="bg-blue-900/20 rounded-lg rounded-tl-none p-3 max-w-xs">
                        <div className="text-xs text-blue-400 mb-1">艾克斯</div>
                        <div className="text-sm text-blue-200">数据显示，这里的氛围很有趣...</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="bg-purple-900/20 rounded-lg rounded-tr-none p-3 max-w-xs">
                        <div className="text-xs text-purple-400 mb-1 text-right">你</div>
                        <div className="text-sm text-purple-200">告诉我更多...</div>
                      </div>
                      <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center">
                        <span className="text-xs">👤</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 输入区域 */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="表达你的内在声音..."
                    className="flex-1 bg-black/40 border border-purple-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all"
                    disabled
                  />
                  <button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    disabled
                  >
                    发送
                  </button>
                </div>
                
                {/* 状态提示 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-purple-400 flex items-center space-x-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>意识连接准备中...</span>
                  </div>
                  <div className="text-gray-500">
                    MVP v0.1 · 创世之心
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部：系统状态 - 神秘主题 */}
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-6 border border-gray-500/20 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              {/* 左：世界状态 */}
              <div className="text-center">
                <div className="text-blue-400 font-semibold mb-2">🌌 世界矩阵</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>信念观察者：<span className="text-blue-300">待激活</span></div>
                  <div>导演引擎：<span className="text-yellow-300">离线</span></div>
                  <div>记忆引擎：<span className="text-green-300">准备中</span></div>
                </div>
              </div>
              
              {/* 中：版本信息 */}
              <div className="text-center">
                <div className="text-purple-400 font-semibold mb-2">🔮 创世之心</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>MVP版本：<span className="text-purple-300">v0.1</span></div>
                  <div>意识棱镜：<span className="text-amber-300">港口酒馆</span></div>
                  <div>开发分支：<span className="text-gray-300">personal-preview</span></div>
                </div>
              </div>
              
              {/* 右：技术栈 */}
              <div className="text-center">
                <div className="text-green-400 font-semibold mb-2">⚡ 技术脉络</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>前端：<span className="text-green-300">Next.js</span></div>
                  <div>后端：<span className="text-blue-300">FastAPI</span></div>
                  <div>部署：<span className="text-purple-300">Vercel</span></div>
                </div>
              </div>
            </div>
            
            {/* 底部：意识探索提示 */}
            <div className="mt-6 pt-4 border-t border-gray-600/20 text-center">
              <div className="text-xs text-gray-500 italic">
                "在这里，每一次互动都是对内在信念的探索，每一个选择都映照着真实的自我..."
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}