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
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>H</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>HELIOS</h1>
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>港口酒馆</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '0.5rem', height: '0.5rem', background: '#22c55e', borderRadius: '50%' }}></div>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>在线</span>
            </div>
            <button
              onClick={() => setIsLoggedIn(false)}
              style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.color = 'white'}
              onMouseOut={(e) => (e.target as HTMLElement).style.color = '#9ca3af'}
            >
              退出
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '1.5rem',
          height: 'calc(100vh - 120px)'
        }}>
          
          {/* 左侧：NPC列表 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{
                width: '0.5rem',
                height: '0.5rem',
                background: '#3b82f6',
                borderRadius: '50%',
                marginRight: '0.75rem'
              }}></span>
              意识体
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* NPC卡片 */}
              {[
                { id: 'aix', name: '艾克斯', role: '数据分析师', quote: '数据不会说谎，但人会。', color: 'blue' },
                { id: 'lia', name: '莉亚', role: '酒馆老板娘', quote: '每个人心里都有故事。', color: 'amber' },
                { id: 'karl', name: '卡尔', role: '退役船长', quote: '海上的规则和陆地不同。', color: 'green' }
              ].map((npc) => (
                <div
                  key={npc.id}
                  onClick={() => setSelectedNPC(npc)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedNPC?.id === npc.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedNPC?.id === npc.id ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: `linear-gradient(to bottom right, ${npc.color === 'blue' ? '#60a5fa' : npc.color === 'amber' ? '#f59e0b' : '#34d399'}, ${npc.color === 'blue' ? '#3b82f6' : npc.color === 'amber' ? '#d97706' : '#10b981'})`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>{npc.name[0]}</span>
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '500', color: 'white' }}>{npc.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{npc.role}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#d1d5db', fontStyle: 'italic' }}>"{npc.quote}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* 中间：对话区域 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 对话头部 */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {selectedNPC ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: `linear-gradient(to bottom right, ${selectedNPC.color === 'blue' ? '#60a5fa' : selectedNPC.color === 'amber' ? '#f59e0b' : '#34d399'}, ${selectedNPC.color === 'blue' ? '#3b82f6' : selectedNPC.color === 'amber' ? '#d97706' : '#10b981'})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>{selectedNPC.name[0]}</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', color: 'white' }}>{selectedNPC.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{selectedNPC.role}</p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#9ca3af' }}>选择一个意识体开始对话</h3>
                </div>
              )}
            </div>

            {/* 对话内容 */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {selectedNPC ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: `linear-gradient(to bottom right, ${selectedNPC.color === 'blue' ? '#60a5fa' : selectedNPC.color === 'amber' ? '#f59e0b' : '#34d399'}, ${selectedNPC.color === 'blue' ? '#3b82f6' : selectedNPC.color === 'amber' ? '#d97706' : '#10b981'})`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedNPC.name[0]}</span>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      borderTopLeftRadius: '0',
                      padding: '1rem',
                      maxWidth: '75%'
                    }}>
                      <p style={{ fontSize: '0.875rem', color: 'white' }}>
                        你好，欢迎来到港口酒馆。我感觉到了你内心的波动...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>💭</span>
                    </div>
                    <p style={{ color: '#9ca3af' }}>等待意识连接...</p>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder={selectedNPC ? "表达你的想法..." : "请先选择一个意识体"}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  disabled={!selectedNPC}
                />
                <button
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    fontWeight: '500',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    opacity: selectedNPC ? 1 : 0.5
                  }}
                  disabled={!selectedNPC}
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：状态面板 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 回响之室 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  background: '#8b5cf6',
                  borderRadius: '50%',
                  marginRight: '0.75rem'
                }}></span>
                回响之室
              </h2>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.2), rgba(79, 70, 229, 0.2))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🌀</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  探索内在的因果联系
                </p>
                <button style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1.5rem',
                  color: '#c4b5fd',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.2s'
                }}>
                  进入探索
                </button>
              </div>
            </div>

            {/* 系统状态 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  background: '#22c55e',
                  borderRadius: '50%',
                  marginRight: '0.75rem'
                }}></span>
                系统状态
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>信念观察者</span>
                  <span style={{ color: '#f59e0b' }}>待激活</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>导演引擎</span>
                  <span style={{ color: '#ef4444' }}>离线</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>记忆引擎</span>
                  <span style={{ color: '#22c55e' }}>运行中</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>在场意识体</span>
                  <span style={{ color: '#3b82f6' }}>3个</span>
                </div>
              </div>
            </div>

            {/* 版本信息 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1rem'
            }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                <p>Helios MVP v0.1</p>
                <p style={{ color: '#6b7280' }}>创世之心</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}