// packages/web/src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';

// 定義一下訊息的資料結構
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 定義可用的NPC
const NPCs = {
  bartender: { name: '酒保老亨利', id: 'bartender' },
  mysterious_traveler: { name: '神秘旅人艾麗絲', id: 'mysterious_traveler' }
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<string>('bartender');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. 先將用戶的訊息新增到畫面上
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 2. 呼叫我們的 Python 後端大腦！
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 將整個對話歷史和角色ID傳給後端
        body: JSON.stringify({ 
          messages: newMessages,
          character_id: currentNPC
        }), 
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // 3. 將 AI 的回覆也新增到畫面上
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Fetch error:', error);
      // 如果出錯了，也在畫面上顯示錯誤訊息
      const errorMessage: Message = { role: 'assistant', content: '抱歉，我的大腦好像短路了...' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 這個 useEffect 會讓聊天室自動滾動到底部
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>赫利俄斯酒館</h1>
      
      {/* NPC選擇器 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
        <label style={{ marginRight: '10px' }}>對話對象：</label>
        <select 
          value={currentNPC} 
          onChange={(e) => {
            setCurrentNPC(e.target.value);
            setMessages([]); // 切換NPC時清空對話
          }}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {Object.entries(NPCs).map(([id, npc]) => (
            <option key={id} value={id}>{npc.name}</option>
          ))}
        </select>
      </div>

      <div id="chat-container" style={{ border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'scroll', marginBottom: '10px', background: '#f9f9f9' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', paddingTop: '160px' }}>對話紀錄將會顯示在這裡...</div>
        ) : (
          messages.map((m, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: m.role === 'user' ? '#e1f5fe' : '#fff' }}>
              <strong>{m.role === 'user' ? '你: ' : `${NPCs[currentNPC as keyof typeof NPCs].name}: `}</strong>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          style={{ width: 'calc(80% - 10px)', padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          value={input}
          placeholder={isLoading ? `${NPCs[currentNPC as keyof typeof NPCs].name}正在思考...` : "說點什麼..."}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" style={{ width: '20%', padding: '10px', borderRadius: '5px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }} disabled={isLoading}>
          {isLoading ? '...' : '送出'}
        </button>
      </form>
    </div>
  );
}