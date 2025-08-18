'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  npc?: {
    id: string;
    name: string;
    role: string;
  };
}

interface NPCOption {
  id: string;
  name: string;
  role: string;
  emoji: string;
  description: string;
}

const NPC_OPTIONS: NPCOption[] = [
  {
    id: 'guard',
    name: '艾尔文队长',
    role: '城市卫兵',
    emoji: '⚔️',
    description: '严格忠诚的卫兵队长，维护城市秩序'
  },
  {
    id: 'wanderer', 
    name: '卡琳',
    role: '流浪者',
    emoji: '🗡️',
    description: '独立警惕的流浪者，不轻易信任他人'
  },
  {
    id: 'scholar',
    name: '莉雅学者',
    role: '知识学者',
    emoji: '📚',
    description: '追求真理的学者，相信知识的力量'
  },
  {
    id: 'merchant',
    name: '雷克斯商人',
    role: '港口商人',
    emoji: '💰',
    description: '精明的商人，善于发现商机'
  },
  {
    id: 'priest',
    name: '艾莉亚祭司',
    role: '神殿祭司',
    emoji: '✨',
    description: '慈悲的祭司，传播信仰和希望'
  },
  {
    id: 'general_ai',
    name: 'AI助手',
    role: '通用助手',
    emoji: '🤖',
    description: '友好的AI助手，帮助理解世界'
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playerId] = useState(`player_${Date.now()}`); // 简单的玩家ID生成
  const [currentNPC, setCurrentNPC] = useState<NPCOption>(NPC_OPTIONS[0]); // 默认选择第一个NPC
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    // 更新界面，显示用户消息
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 调用 API，包含玩家ID和NPC ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          player_id: playerId,
          npc_id: currentNPC.id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // 添加 AI 回复
      const aiMessage: Message = { 
        role: 'assistant', 
        content: data.reply,
        npc: data.npc,
        timestamp: data.timestamp
      };
      setMessages([...newMessages, aiMessage]);

    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 显示错误消息
      const errorMessage: Message = {
        role: 'assistant',
        content: `错误: ${error instanceof Error ? error.message : '发送消息失败，请重试。'}`
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        {/* 游戏化标题栏 */}
        <div className="text-center mb-6 p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🌟 Helios · 本我之镜 🌟
          </h1>
          <div className="text-cyan-300 text-sm font-medium mb-4">
            🎭 玩家ID: {playerId.slice(-8)} | ⚡ 港口酒馆 | 🌙 意识探索
          </div>
          
          {/* NPC选择器 */}
          <div className="flex flex-wrap justify-center gap-2">
            {NPC_OPTIONS.map((npc) => (
              <button
                key={npc.id}
                onClick={() => setCurrentNPC(npc)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                  currentNPC.id === npc.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-cyan-200 hover:bg-white/20'
                }`}
                title={npc.description}
              >
                {npc.emoji} {npc.name}
              </button>
            ))}
          </div>
          
          {/* 当前对话角色信息 */}
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="text-cyan-100 font-medium">
              正在与 {currentNPC.emoji} <span className="text-blue-300">{currentNPC.name}</span> 对话
            </div>
            <div className="text-cyan-300 text-xs mt-1">
              {currentNPC.role} · {currentNPC.description}
            </div>
          </div>
        </div>
      
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
          {messages.length === 0 ? (
            <div className="text-center text-cyan-200 mt-8 space-y-4">
              <div className="text-6xl">🌌</div>
              <div className="text-xl font-semibold">欢迎来到意识之境</div>
              <div className="text-cyan-300">开始你的第一次对话吧！AI正在等待与你交流...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* 头像 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                        : 'bg-gradient-to-r from-green-400 to-cyan-400'
                    }`}>
                      {message.role === 'user' 
                        ? '🎭' 
                        : (message.npc ? 
                            NPC_OPTIONS.find(npc => npc.id === message.npc?.id)?.emoji || '🤖'
                            : '🤖')
                      }
                    </div>
                    
                    {/* 消息气泡 */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/90 text-gray-800 border border-white/20'
                      }`}
                    >
                      {message.role === 'assistant' && message.npc && (
                        <div className="text-xs text-gray-500 mb-1 font-medium">
                          {message.npc.name} · {message.npc.role}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center text-xl">
                      {currentNPC.emoji}
                    </div>
                    <div className="bg-white/90 text-gray-800 border border-white/20 px-4 py-3 rounded-2xl shadow-lg">
                      <div className="text-xs text-gray-500 mb-1 font-medium">
                        {currentNPC.name} · {currentNPC.role}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-cyan-600 font-medium">{currentNPC.name} 正在思考...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`🌟 与${currentNPC.name}对话... (Enter 发送，Shift+Enter 换行)`}
                className="w-full px-4 py-3 bg-white/90 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none text-gray-800 placeholder-gray-500"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                !input.trim() || isLoading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>发送中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>发送</span>
                  <span>🚀</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
