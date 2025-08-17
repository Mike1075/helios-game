'use client';

import { useState } from 'react';

// UI Rebuild based on the "Creator" role.
// The AI chat functionality will be reintegrated in the next step,
// strictly following the official specification.

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // Main UI - Rebuilt with a clean, premium feel
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0b0f19',
      color: '#e5e7eb',
      fontFamily: '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Left Panel: NPC List */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #1f2937',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        background: '#111827',
      }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '600', color: 'white' }}>意识连接对象</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {NPCS.map((npc) => (
            <div
              key={npc.id}
              onClick={() => setSelectedNPC(npc)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedNPC?.id === npc.id ? '#3b82f6' : 'rgba(55, 65, 81, 0.5)',
                border: `1px solid ${selectedNPC?.id === npc.id ? '#3b82f6' : 'transparent'}`,
                transition: 'all 0.2s ease-in-out',
                transform: selectedNPC?.id === npc.id ? 'translateX(5px)' : 'none',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'white' }}>{npc.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>{npc.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px'
      }}>
        {selectedNPC ? (
          <>
            <div style={{
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid #1f2937',
            }}>
                <h2 style={{margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>{selectedNPC.name}</h2>
                <p style={{margin: '8px 0 0', color: '#9ca3af', fontStyle: 'italic'}}>“{selectedNPC.catchphrase}”</p>
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1f2937', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <p style={{ fontSize: '1rem' }}>聊天功能正在重建中</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>AI 核心即将上线...</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <input
                placeholder="意识连接已断开..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                disabled={true}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#9ca3af',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'not-allowed',
                }}
                disabled={true}
              >
                发送
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280', flexDirection: 'column', gap: '16px' }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Z"></path><path d="M4.929 4.929 19.07 19.07"></path><path d="m12 18-3.5-3.5"></path><path d="m15.5 12-2-2"></path><path d="M12 6.002V6"></path><path d="M6 12h-.002"></path></svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '500' }}>未选择连接对象</h2>
            <p style={{ color: '#4b5563' }}>请从左侧列表选择一个意识体以建立连接</p>
          </div>
        )}
      </div>
    </div>
  );
}