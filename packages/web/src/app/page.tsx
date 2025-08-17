'use client'

import { useState, useEffect, useRef } from 'react'

// 定义数据结构类型
interface NPC {
  id: string;
  name: string;
  role: string;
  quote: string;
  color: string;
}

interface Message {
  sender: 'user' | 'npc';
  text: string;
  npcName?: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 模拟的NPC数据
  const npcs: NPC[] = [
    { id: 'aix', name: '艾克斯', role: '数据分析师', quote: '数据不会说谎，但人会。', color: 'blue' },
    { id: 'lia', name: '莉亚', role: '酒馆老板娘', quote: '每个人心里都有故事。', color: 'amber' },
    { id: 'karl', name: '卡尔', role: '退役船长', quote: '海上的规则和陆地不同。', color: 'green' }
  ];

  // 聊天记录滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 选择NPC时重置聊天记录
  useEffect(() => {
    if (selectedNPC) {
      setMessages([{
        sender: 'npc',
        text: `你好，我是${selectedNPC.name}。你想聊些什么？`,
        npcName: selectedNPC.name
      }]);
    } else {
      setMessages([]);
    }
  }, [selectedNPC]);

  const handleSendMessage = async () => {
    if (userInput.trim() === '' || !selectedNPC) return;

    const userMessage: Message = { sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // 在这里替换为您的Vercel部署的API地址
      const apiUrl = '/api/chat'; 
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: 'user123', // 临时玩家ID
          npc_id: selectedNPC.id,
          message: userInput,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      const npcMessage: Message = {
        sender: 'npc',
        text: data.message,
        npcName: data.npc_name
      };
      setMessages(prev => [...prev, npcMessage]);

    } catch (error) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        sender: 'npc',
        text: '意识连接出现波动，我暂时无法回应...',
        npcName: selectedNPC.name
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录界面
  if (!isLoggedIn) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #020617, #0f172a, #020617)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '26rem',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>H</span>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>HELIOS</h1>
              <p style={{ color: '#9ca3af', fontSize: '1rem' }}>意识的棱镜</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => setIsLoggedIn(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s'
                }}
              >
                进入意识世界
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 主游戏界面 - 全新两栏布局
  return (
    <main style={{
      height: '100vh',
      background: 'linear-gradient(170deg, #020617, #111827, #020617)',
      color: 'white',
      fontFamily: 'sans-serif',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* 左侧：意识体选择面板 */}
      <div style={{
        width: '320px',
        background: 'rgba(17, 24, 39, 0.7)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{
              width: '2.5rem', height: '2.5rem', background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>H</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>HELIOS</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>港口酒馆</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>在场意识体</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
          {npcs.map((npc) => (
            <div
              key={npc.id}
              onClick={() => setSelectedNPC(npc)}
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                background: selectedNPC?.id === npc.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedNPC?.id === npc.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                transform: selectedNPC?.id === npc.id ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <h3 style={{ fontWeight: '600', fontSize: '1.125rem', color: 'white' }}>{npc.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{npc.role}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={() => setIsLoggedIn(false)}
            style={{
              width: '100%', background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.75rem',
              borderRadius: '0.5rem', cursor: 'pointer', color: '#9ca3af'
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* 右侧：对话界面 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedNPC ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 对话内容 */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: '1rem'
                  }}>
                    {msg.sender === 'npc' && (
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <span style={{ fontWeight: 'bold' }}>{msg.npcName?.[0]}</span>
                      </div>
                    )}
                    <div style={{
                      background: msg.sender === 'user' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      padding: '1rem', borderRadius: '1rem',
                      borderTopLeftRadius: msg.sender === 'npc' ? '0' : '1rem',
                      borderTopRightRadius: msg.sender === 'user' ? '0' : '1rem',
                      maxWidth: '70%'
                    }}>
                      <p style={{ lineHeight: 1.6 }}>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                   <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem' }}>
                     <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <span style={{ fontWeight: 'bold' }}>{selectedNPC.name[0]}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '1rem', borderTopLeftRadius: '0' }}>
                         <div style={{ width: '8px', height: '8px', background: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                         <div style={{ width: '8px', height: '8px', background: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
                         <div style={{ width: '8px', height: '8px', background: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
                      </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* 输入框 */}
            <div style={{ padding: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: '#111827' }}>
              <div style={{
                maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '1rem',
                background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem', borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder={`与 ${selectedNPC.name} 对话...`}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: 'white', fontSize: '1rem', outline: 'none', padding: '0.5rem'
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  style={{
                    background: '#3b82f6', color: 'white', fontWeight: '600',
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                    border: 'none', cursor: 'pointer', opacity: isLoading ? 0.5 : 1
                  }}
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '3rem' }}>←</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', color: '#9ca3af' }}>请选择一位意识体</h2>
            <p style={{ color: '#6b7280' }}>开始你的意识探索之旅</p>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </main>
  );
}