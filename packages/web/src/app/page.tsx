// packages/web/src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';

// 定义一下消息的数据结构
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 定义可用的NPC（key必须与文件名匹配）
const NPCs = {
  bartender: { name: '酒保老亨利', id: 'bartender' },
  mysterious_traveler: { name: '神秘旅人艾丽丝', id: 'mysterious_traveler' },
  npc_002: { name: '诺娃', id: 'npc_002' },
  npc_006: { name: '莉莉', id: 'npc_006' }
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<string>('bartender');
  const [dialogueMode, setDialogueMode] = useState<'player' | 'npc_to_npc'>('player');
  const [targetNPC, setTargetNPC] = useState<string>('mysterious_traveler');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. 先将用户的消息新增到界面上
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 2. 调用我们的 Python 后端大脑！
      const endpoint = dialogueMode === 'npc_to_npc' ? '/api/npc-dialogue' : '/api/chat';
      const body = dialogueMode === 'npc_to_npc' 
        ? { 
            speaker_id: currentNPC,
            target_id: targetNPC,
            message: input
          }
        : {
            messages: newMessages,
            character_id: currentNPC
          };

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), 
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // 3. 将 AI 的回复也新增到界面上
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Fetch error:', error);
      // 如果出错了，也在界面上显示错误消息
      const errorMessage: Message = { role: 'assistant', content: '抱歉，我的大脑好像短路了...' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 触发认知失调检测
  const triggerCognitiveDissonance = async () => {
    try {
      const response = await fetch('/api/check-dissonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_id: 'player_001',
          conversation_history: messages 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.dissonance_detected) {
          alert('检测到认知失调！回响之室已激活。');
        } else {
          alert('未检测到认知失调。');
        }
      }
    } catch (error) {
      console.error('认知失调检测错误:', error);
    }
  };

  // 打开回响之室
  const openEchoRoom = async () => {
    try {
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_id: 'player_001',
          event_id: 'sample_event_001' 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const echoMessage: Message = { 
          role: 'assistant', 
          content: `【回响之室】\n${data.echo}` 
        };
        setMessages(prev => [...prev, echoMessage]);
      }
    } catch (error) {
      console.error('回响之室错误:', error);
    }
  };
  
  // 这个 useEffect 会让聊天室自动滚动到底部
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>赫利俄斯酒馆</h1>
      
      {/* 对话模式选择器 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
        <label style={{ marginRight: '10px' }}>对话模式：</label>
        <select 
          value={dialogueMode} 
          onChange={(e) => {
            setDialogueMode(e.target.value as 'player' | 'npc_to_npc');
            setMessages([]); // 切换模式时清空对话
          }}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '20px' }}
        >
          <option value="player">玩家对话</option>
          <option value="npc_to_npc">NPC间对话</option>
        </select>
        
        {dialogueMode === 'player' && (
          <>
            <label style={{ marginRight: '10px' }}>对话对象：</label>
            <select 
              value={currentNPC} 
              onChange={(e) => {
                setCurrentNPC(e.target.value);
                setMessages([]); // 切换NPC时清空对话
              }}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {Object.entries(NPCs).map(([id, npc]) => (
                <option key={id} value={id}>{npc.name}</option>
              ))}
            </select>
          </>
        )}
        
        {dialogueMode === 'npc_to_npc' && (
          <>
            <label style={{ marginRight: '10px' }}>发言者：</label>
            <select 
              value={currentNPC} 
              onChange={(e) => setCurrentNPC(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '20px' }}
            >
              {Object.entries(NPCs).map(([id, npc]) => (
                <option key={id} value={id}>{npc.name}</option>
              ))}
            </select>
            
            <label style={{ marginRight: '10px' }}>对话目标：</label>
            <select 
              value={targetNPC} 
              onChange={(e) => setTargetNPC(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {Object.entries(NPCs).filter(([id]) => id !== currentNPC).map(([id, npc]) => (
                <option key={id} value={id}>{npc.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* 功能按钮 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#e8f4fd', borderRadius: '8px' }}>
        <button 
          onClick={triggerCognitiveDissonance}
          style={{ padding: '8px 16px', marginRight: '10px', borderRadius: '4px', border: 'none', background: '#ff9800', color: 'white', cursor: 'pointer' }}
        >
          检测认知失调
        </button>
        <button 
          onClick={openEchoRoom}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#9c27b0', color: 'white', cursor: 'pointer' }}
        >
          打开回响之室
        </button>
      </div>

      <div id="chat-container" style={{ border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'scroll', marginBottom: '10px', background: '#f9f9f9' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', paddingTop: '160px' }}>对话记录将会显示在这里...</div>
        ) : (
          messages.map((m, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: m.role === 'user' ? '#e1f5fe' : '#fff' }}>
              <strong>
                {m.role === 'user' ? 
                  (dialogueMode === 'npc_to_npc' ? `${NPCs[currentNPC as keyof typeof NPCs].name}: ` : '你: ') : 
                  (dialogueMode === 'npc_to_npc' ? `${NPCs[targetNPC as keyof typeof NPCs].name}: ` : `${NPCs[currentNPC as keyof typeof NPCs].name}: `)
                }
              </strong>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          style={{ width: 'calc(80% - 10px)', padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          value={input}
          placeholder={isLoading ? 
            (dialogueMode === 'npc_to_npc' ? 
              `${NPCs[targetNPC as keyof typeof NPCs].name}正在思考...` : 
              `${NPCs[currentNPC as keyof typeof NPCs].name}正在思考...`) : 
            "说点什么..."
          }
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" style={{ width: '20%', padding: '10px', borderRadius: '5px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }} disabled={isLoading}>
          {isLoading ? '...' : '发送'}
        </button>
      </form>
    </div>
  );
}