'use client'

import { useState } from 'react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedNPC, setSelectedNPC] = useState<any>(null)

  // 登录界面
  if (!isLoggedIn) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #000000)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '28rem',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* 登录卡片 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Logo区域 */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>H</span>
              </div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>HELIOS</h1>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>意识的棱镜</p>
            </div>

            {/* 登录表单 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '0.5rem'
                }}>
                  用户名
                </label>
                <input
                  type="text"
                  placeholder="输入您的用户名"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '0.5rem'
                }}>
                  密码
                </label>
                <input
                  type="password"
                  placeholder="输入您的密码"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button
                onClick={() => setIsLoggedIn(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.background = 'linear-gradient(to right, #2563eb, #7c3aed)'
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)'
                }}
              >
                进入意识世界
              </button>

              {/* 注册链接 */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  还没有账户？{' '}
                  <button style={{
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}>
                    创建新的意识档案
                  </button>
                </p>
              </div>
            </div>

            {/* 版本信息 */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                Helios MVP v0.1 · 创世之心
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 主游戏界面
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* 顶部导航栏 */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">H</span>
              </div>
              <h1 className="text-xl font-semibold text-white">HELIOS</h1>
              <span className="text-gray-400 text-sm">港口酒馆</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400 text-sm">在线</span>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            
            {/* 左侧：NPC列表 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                意识体
              </h2>
              
              <div className="space-y-3">
                {/* NPC卡片 */}
                {[
                  { id: 'aix', name: '艾克斯', role: '数据分析师', quote: '数据不会说谎，但人会。', color: 'blue' },
                  { id: 'lia', name: '莉亚', role: '酒馆老板娘', quote: '每个人心里都有故事。', color: 'amber' },
                  { id: 'karl', name: '卡尔', role: '退役船长', quote: '海上的规则和陆地不同。', color: 'green' }
                ].map((npc) => (
                  <div
                    key={npc.id}
                    onClick={() => setSelectedNPC(npc)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedNPC?.id === npc.id
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        npc.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        npc.color === 'amber' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                        'bg-gradient-to-br from-green-400 to-green-600'
                      }`}>
                        <span className="text-white font-bold text-sm">{npc.name[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{npc.name}</h3>
                        <p className="text-xs text-gray-400">{npc.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 italic">"{npc.quote}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 中间：对话区域 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 flex flex-col">
              {/* 对话头部 */}
              <div className="p-6 border-b border-white/10">
                {selectedNPC ? (
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedNPC.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      selectedNPC.color === 'amber' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      'bg-gradient-to-br from-green-400 to-green-600'
                    }`}>
                      <span className="text-white font-bold text-sm">{selectedNPC.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedNPC.name}</h3>
                      <p className="text-sm text-gray-400">{selectedNPC.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-400">选择一个意识体开始对话</h3>
                  </div>
                )}
              </div>

              {/* 对话内容 */}
              <div className="flex-1 p-6 overflow-y-auto">
                {selectedNPC ? (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedNPC.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        selectedNPC.color === 'amber' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                        'bg-gradient-to-br from-green-400 to-green-600'
                      }`}>
                        <span className="text-white text-xs font-bold">{selectedNPC.name[0]}</span>
                      </div>
                      <div className="bg-white/10 rounded-lg rounded-tl-none p-4 max-w-xs">
                        <p className="text-sm text-white">
                          你好，欢迎来到港口酒馆。我感觉到了你内心的波动...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">💭</span>
                      </div>
                      <p className="text-gray-400">等待意识连接...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="p-6 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={selectedNPC ? "表达你的想法..." : "请先选择一个意识体"}
                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                    disabled={!selectedNPC}
                  />
                  <button
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-all"
                    disabled={!selectedNPC}
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：状态面板 */}
            <div className="space-y-6">
              {/* 回响之室 */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  回响之室
                </h2>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🌀</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    探索内在的因果联系
                  </p>
                  <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg px-6 py-2 text-purple-300 text-sm transition-all duration-300 w-full">
                    进入探索
                  </button>
                </div>
              </div>

              {/* 系统状态 */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  系统状态
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">信念观察者</span>
                    <span className="text-yellow-400">待激活</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">导演引擎</span>
                    <span className="text-red-400">离线</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">记忆引擎</span>
                    <span className="text-green-400">运行中</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">在场意识体</span>
                    <span className="text-blue-400">3个</span>
                  </div>
                </div>
              </div>

              {/* 版本信息 */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                <div className="text-center text-xs text-gray-400">
                  <p>Helios MVP v0.1</p>
                  <p className="text-gray-500">创世之心</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}