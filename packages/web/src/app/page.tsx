'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';

// 定义数据结构类型
interface NPC {
  id: string;
  name: string;
  role: string;
  core_motivation: string;
  personality: string;
  catchphrase: string;
  color: 'blue' | 'amber' | 'green';
}

const NPCS: NPC[] = [
    {
        id: '1',
        name: '伊拉',
        role: '酒馆老板',
        core_motivation: '为在“本我之镜”中迷失的灵魂提供一个温暖的避风港，收集并保管他们的故事',
        personality: '温暖、包容，略带神秘，对每个人的故事都充满兴趣',
        catchphrase: '“每杯酒里，都藏着一个世界。”',
        color: 'blue',
    },
    {
        id: '2',
        name: '卡俄斯',
        role: '赏金猎人',
        core_motivation: '追寻在虚拟世界中失踪的妹妹，为此不惜一切代价',
        personality: '外冷内热，言语不多但行动果断，只信任有实力的人',
        catchphrase: '“情报，或者死。”',
        color: 'amber',
    },
    {
        id: '3',
        name: '莉莉丝',
        role: '“真理黑客”',
        core_motivation: '探寻“本我之镜”的底层代码，试图找到其被称为“世界之心”的真相',
        personality: '冷静、理性，对技术和数据有着超乎常人的敏锐，偶尔会说出让人难以理解的代码术语',
        catchphrase: '“数据不会说谎，说谎的是人。”',
        color: 'green',
    },
];

export default function TavernChat() {
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Keep login state

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      npc: selectedNPC,
    },
    onFinish() {
      console.log('Finished!');
    },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Login page remains the same
  if (!isLoggedIn) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            color: 'white',
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        }}>
            <div style={{
                padding: '40px',
                background: 'rgba(31, 41, 55, 0.8)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px', fontWeight: '600' }}>Helios</h1>
                <p style={{ fontSize: '1rem', color: '#d1d5db', marginBottom: '30px' }}>本我之镜</p>
                <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
                    <input
                        type="text"
                        placeholder="输入您的访问代码"
                        style={{
                            width: '100%',
                            padding: '12px',
                            marginBottom: '20px',
                            background: 'rgba(55, 65, 81, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            (e.target as HTMLElement).style.background = 'linear-gradient(to right, #1d4ed8, #6d28d9)';
                            (e.target as HTMLElement).style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.5)';
                        }}
                        onMouseOut={(e) => {
                            (e.target as HTMLElement).style.background = 'linear-gradient(to right, #2563eb, #7c3aed)';
                            (e.target as HTMLElement).style.boxShadow = 'none';
                        }}
                    >
                        连接意识
                    </button>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: 'white',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Left Panel: NPC List */}
      <div style={{
        width: '300px',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(31, 41, 55, 0.5)',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: '600' }}>意识连接对象</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {NPCS.map((npc) => (
            <div
              key={npc.id}
              onClick={() => setSelectedNPC(npc)}
              style={{
                padding: '15px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedNPC?.id === npc.id ? 'linear-gradient(to right, #2563eb, #7c3aed)' : 'rgba(55, 65, 81, 0.5)',
                border: `1px solid ${selectedNPC?.id === npc.id ? 'rgba(99, 102, 241, 0.7)' : 'rgba(255, 255, 255, 0.1)'}`,
                transition: 'all 0.3s ease',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{npc.name}</h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#d1d5db' }}>{npc.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px'
      }}>
        {selectedNPC ? (
          <>
            <div style={{
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
                <h2 style={{margin: 0, fontSize: '1.8rem', fontWeight: 'bold'}}>{selectedNPC.name}</h2>
                <p style={{margin: '5px 0 0', color: '#d1d5db'}}>“{selectedNPC.catchphrase}”</p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {messages.length > 0 ? (
                messages.map(m => (
                  <div key={m.id} style={{ marginBottom: '15px', display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '12px',
                      background: m.role === 'user' ? 'linear-gradient(to right, #2563eb, #7c3aed)' : 'rgba(55, 65, 81, 0.8)',
                    }}>
                      <strong>{m.role === 'user' ? 'You' : selectedNPC.name}: </strong>
                      {m.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', color: '#9ca3af', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <p>意识连接已建立。开始对话...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="输入你的想法..."
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(55, 65, 81, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? '思考中...' : '发送'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af' }}>
            <h2>请从左侧选择一个对象进行意识连接</h2>
          </div>
        )}
      </div>
    </div>
  );
}