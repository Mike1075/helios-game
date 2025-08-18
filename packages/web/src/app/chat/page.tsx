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
  const [showEcho, setShowEcho] = useState(false); // 控制回响之室显示
  const [echoInput, setEchoInput] = useState(''); // 回响之室输入
  const [isEchoLoading, setIsEchoLoading] = useState(false); // 回响之室加载状态
  const [showBelief, setShowBelief] = useState(false); // 控制信念系统显示
  const [beliefData, setBeliefData] = useState<any>(null); // 信念系统数据
  const [isBeliefLoading, setIsBeliefLoading] = useState(false); // 信念系统加载状态
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

  // 发送回响之室请求
  const sendEchoRequest = async () => {
    if (!echoInput.trim() || isEchoLoading) return;

    setIsEchoLoading(true);

    try {
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          confusion: echoInput.trim(),
          context: messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n') // 最近3条消息作为上下文
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // 添加回响结果作为特殊消息
      const echoMessage: Message = {
        role: 'assistant',
        content: `🪞 **回响之室的启示：**\n\n${data.echo}`,
        timestamp: data.timestamp,
        npc: {
          id: 'echo_chamber',
          name: '回响之室',
          role: '内省助手'
        }
      };
      
      setMessages(prev => [...prev, echoMessage]);
      setEchoInput('');
      setShowEcho(false);

    } catch (error) {
      console.error('回响之室请求失败:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `🪞 **回响之室暂时无法响应：**\n\n${error instanceof Error ? error.message : '请稍后再试'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsEchoLoading(false);
    }
  };

  // 获取玩家信念系统
  const fetchBeliefSystem = async () => {
    if (isBeliefLoading) return;

    setIsBeliefLoading(true);

    try {
      // 调用信念观察者API手动分析
      const analyzeResponse = await fetch('/api/belief-observer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character_id: playerId,
          trigger_event: '玩家主动查看信念系统'
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(`分析失败: ${analyzeResponse.status}`);
      }

      const analyzeData = await analyzeResponse.json();
      
      if (analyzeData.error) {
        throw new Error(analyzeData.error);
      }

      setBeliefData(analyzeData);
      setShowBelief(true);

    } catch (error) {
      console.error('获取信念系统失败:', error);
      // 可以添加错误提示
    } finally {
      setIsBeliefLoading(false);
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
            <div className="flex flex-col space-y-2">
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
              
              {/* 回响之室按钮 */}
              <button
                onClick={() => setShowEcho(true)}
                disabled={isLoading || isEchoLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
                title="当你感到困惑时，回响之室能帮你理解内心的声音"
              >
                🪞 回响之室
              </button>

              {/* 信念系统按钮 */}
              <button
                onClick={fetchBeliefSystem}
                disabled={isLoading || isBeliefLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
                title="查看你的信念系统 - 看见驱动你的深层信念"
              >
                {isBeliefLoading ? '⏳ 分析中...' : '🔍 我的信念'}
              </button>
            </div>
          </div>
        </div>

        {/* 回响之室弹窗 */}
        {showEcho && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-purple-500/30">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-purple-200 mb-2">🪞 回响之室</h2>
                <p className="text-purple-300 text-sm">当你感到困惑时，让内心的声音为你解答</p>
              </div>
              
              <div className="mb-4">
                <textarea
                  value={echoInput}
                  onChange={(e) => setEchoInput(e.target.value)}
                  placeholder="描述你的困惑或疑问... 例如：为什么NPC会这样反应？我不理解刚才发生的事情..."
                  className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-white placeholder-purple-300"
                  rows={3}
                  disabled={isEchoLoading}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEcho(false)}
                  disabled={isEchoLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-purple-200 bg-white/10 hover:bg-white/20 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={sendEchoRequest}
                  disabled={!echoInput.trim() || isEchoLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    !echoInput.trim() || isEchoLoading
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  {isEchoLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>倾听中...</span>
                    </div>
                  ) : (
                    '🔮 聆听内心'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 信念系统弹窗 */}
        {showBelief && beliefData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-amber-500/30 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-200 mb-2">🔍 我的信念系统</h2>
                <button
                  onClick={() => setShowBelief(false)}
                  className="text-amber-300 hover:text-amber-100 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <h3 className="text-amber-300 font-semibold mb-2">📊 分析概要</h3>
                  <p className="text-amber-100 text-sm">
                    置信度: {Math.round((beliefData.confidence_score || 0) * 100)}%
                  </p>
                  <p className="text-amber-100 text-sm">
                    分析时间: {new Date().toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4">
                  <h3 className="text-amber-300 font-semibold mb-2">📜 信念档案 (YAML)</h3>
                  <pre className="text-amber-100 text-xs bg-black/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
{beliefData.belief_yaml}
                  </pre>
                </div>
                
                {beliefData.analysis_summary && (
                  <div className="bg-black/20 rounded-lg p-4">
                    <h3 className="text-amber-300 font-semibold mb-2">🔬 详细分析</h3>
                    <div className="text-amber-100 text-sm whitespace-pre-wrap">
                      {beliefData.analysis_summary}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowBelief(false)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
