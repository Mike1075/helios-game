'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playerId] = useState(`player_${Date.now()}`); // 简单的玩家ID生成
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
      // 调用 API，包含玩家ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          player_id: playerId 
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
      const aiMessage: Message = { role: 'assistant', content: data.reply };
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            🌟 Helios · 意识之境 🌟
          </h1>
          <div className="text-cyan-300 text-sm font-medium">
            🎭 玩家ID: {playerId.slice(-8)} | 💫 AI聊天助手 | ⚡ 实时对话
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
                      {message.role === 'user' ? '🎭' : '🤖'}
                    </div>
                    
                    {/* 消息气泡 */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/90 text-gray-800 border border-white/20'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center text-xl">
                      🤖
                    </div>
                    <div className="bg-white/90 text-gray-800 border border-white/20 px-4 py-3 rounded-2xl shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-cyan-600 font-medium">AI 正在思考...</span>
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
                placeholder="🌟 输入你的消息，与AI开始对话... (Enter 发送，Shift+Enter 换行)"
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
