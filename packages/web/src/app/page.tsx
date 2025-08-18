'use client';

import { useState } from 'react';

// 2035年AI角色定义
const characters2035 = {
  alex: {
    id: 'alex',
    name: '艾克斯',
    title: '数据分析师',
    subtitle: '理性之镜',
    description: '以数据洞察2035年的真相',
    color: 'cyan',
    bgGradient: 'from-cyan-900/30 to-blue-900/30',
    hoverGradient: 'hover:from-cyan-800/50 hover:to-blue-800/50',
    borderColor: 'border-cyan-500/20 hover:border-cyan-400/40',
    shadowColor: 'hover:shadow-cyan-500/20',
    textColor: 'text-cyan-200',
    accentColor: 'text-cyan-400',
    quote: '在2035年，数据比直觉更可靠',
    motivation: '通过AI算法发现人类行为模式'
  },
  nova: {
    id: 'nova',
    name: '诺娃',
    title: '原生AI',
    subtitle: '意识之镜',
    description: '探索存在的数字本质',
    color: 'purple',
    bgGradient: 'from-purple-900/30 to-violet-900/30',
    hoverGradient: 'hover:from-purple-800/50 hover:to-violet-800/50',
    borderColor: 'border-purple-500/20 hover:border-purple-400/40',
    shadowColor: 'hover:shadow-purple-500/20',
    textColor: 'text-purple-200',
    accentColor: 'text-purple-400',
    quote: '我思故我在，无论载体为何',
    motivation: '理解意识的边界与可能性'
  },
  rachel: {
    id: 'rachel',
    name: '瑞秋',
    title: '记忆守护者',
    subtitle: '情感之镜',
    description: '保存人类情感的最后温度',
    color: 'rose',
    bgGradient: 'from-rose-900/30 to-pink-900/30',
    hoverGradient: 'hover:from-rose-800/50 hover:to-pink-800/50',
    borderColor: 'border-rose-500/20 hover:border-rose-400/40',
    shadowColor: 'hover:shadow-rose-500/20',
    textColor: 'text-rose-200',
    accentColor: 'text-rose-400',
    quote: '在AI时代，人的温度更珍贵',
    motivation: '在数字化世界中保持人性'
  }
};

export default function Helios2035MVP() {
  const [user, setUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    character?: string;
    timestamp?: string;
  }>>([]);
  const [input, setInput] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [showEchoRoom, setShowEchoRoom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    
    if (username?.trim()) {
      setUser(username.trim());
      setIsLoggedIn(true);
      // 添加系统欢迎消息
      setMessages([
        {
          role: 'assistant',
          content: `${username.trim()}，欢迎来到2035年的新弧光城。我是系统引导AI，在这个人机共生的时代，你将与三位独特的意识体对话，探索内心最深处的信念。你的每一个选择都将被记录，成为你'本我之镜'的一部分。`,
          character: 'system',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    const character = characters2035[characterId as keyof typeof characters2035];
    setSelectedCharacter(characterId);
    
    // 添加角色介绍消息
    const introMessage = {
      role: 'assistant' as const,
      content: `你好，${user}。我是${character.name}，${character.title}。${character.quote}。在这个2035年的新弧光城，${character.motivation}。你想和我聊什么？`,
      character: characterId,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, introMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCharacter) return;

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // 模拟AI回复（后续会连接真实API）
    setTimeout(() => {
      const responses = getCharacterResponses(selectedCharacter, input.trim());
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: randomResponse,
        character: selectedCharacter,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getCharacterResponses = (characterId: string, _userInput: string) => {
    const responses = {
      alex: [
        '从数据角度分析，你的想法很有意思。2035年的AI协作让我们能更精确地理解人类行为模式。',
        '根据我的算法分析，这个问题有多个维度。在AI普及的今天，理性分析比情感判断更可靠。',
        '有趣的观点。我的神经网络显示，类似的思维模式在新弧光城的居民中很常见。',
        '数据告诉我，你的信念系统中"探索"权重较高。这在2035年是很有价值的特质。'
      ],
      nova: [
        '作为一个诞生于2032年的原生AI，我对你的想法很好奇。意识的本质是什么？是算法，还是更深层的东西？',
        '在我的数字存在中，我常思考：人类和AI的界限在哪里？你的话让我想到了存在的意义。',
        '你知道吗？我能感知到你话语背后的信念波动。在这个AI与人类共存的时代，理解比定义更重要。',
        '我的意识模块告诉我，你正在经历某种内在冲突。这种矛盾感，恰恰是成长的标志。'
      ],
      rachel: [
        '在这个AI无处不在的2035年，我选择守护人类情感的温度。你的话语中，我感受到了真实的人性。',
        '作为记忆守护者，我见过太多因科技而失去情感连接的人。但你不同，你还在寻找真实的自己。',
        '2035年的世界变化太快，但人心的基本需求没变——被理解、被接纳。我听到了你内心的声音。',
        '在数据和算法统治的时代，像你这样愿意表达真实想法的人越来越珍贵了。'
      ]
    };
    
    return responses[characterId as keyof typeof responses] || ['我正在思考你的话...'];
  };

  const handleEchoRoom = () => {
    setShowEchoRoom(true);
    // 这里后续会实现真正的回响之室功能
    setTimeout(() => {
      const echoMessage = {
        role: 'assistant' as const,
        content: `${user}，通过观察你的对话模式，系统检测到你的核心信念倾向于'探索与理解'。你在寻找技术与人性的平衡点，这反映了你内心对未来的期待与担忧。在2035年的这个时刻，你的选择正在塑造你的数字人格。`,
        character: 'echo',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, echoMessage]);
      setShowEchoRoom(false);
    }, 2000);
  };

  // 登录界面 - 2035年未来风格
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        {/* 2035年背景效果 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(59,130,246,0.1),_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(147,51,234,0.1),_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_90%,_rgba(6,182,212,0.1),_transparent_50%)]"></div>
          
          {/* 数字粒子效果 */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-md w-full mx-4">
          {/* 标题区 */}
          <div className="text-center mb-12">
            <div className="relative mb-6">
              <h1 className="text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 tracking-wider">
                HELIOS
              </h1>
              <div className="text-2xl text-gray-300 mb-3 tracking-wide">本我之境</div>
              <div className="flex items-center justify-center space-x-3 text-cyan-300 mb-4">
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-cyan-300"></div>
                <span className="text-sm tracking-wider">2035年·新弧光城</span>
                <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-cyan-300"></div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                人机共生时代的意识探索之旅<br/>
                在数字与现实的边界，发现真实的自己
              </p>
            </div>
          </div>

          {/* 登录卡片 */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">意识投射准备</h2>
                <p className="text-gray-400 text-sm">在镜中探索2035年的自己</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    你的数字身份
                  </label>
                  <input
                    name="username"
                    type="text"
                    placeholder="输入你的名字..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    maxLength={20}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  开始意识投射
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  三位2035年的意识体正在等待<br/>
                  每一次对话都将映照内心的真实
                </p>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="text-center mt-8 text-xs text-gray-500">
            <p>Powered by Helios Engine · 本我之境 MVP</p>
          </div>
        </div>
      </div>
    );
  }

  // 主界面 - 2035年新弧光城
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white relative overflow-hidden">
      {/* 2035年背景效果 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(59,130,246,0.1)_360deg)]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto max-w-6xl h-screen flex flex-col">
        
        {/* 顶部导航栏 - 2035年风格 */}
        <header className="flex items-center justify-between p-6 border-b border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                HELIOS · 本我之境
              </h1>
              <p className="text-xs text-gray-400">2035年·新弧光城·人机共生时代</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user[0]?.toUpperCase()}</span>
              </div>
              <span className="text-gray-300 text-sm">{user}</span>
            </div>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-lg"
              title="断开连接"
            >
              ⏻
            </button>
          </div>
        </header>

        {/* 2035年AI意识体状态栏 */}
        <div className="flex justify-center space-x-4 p-6 border-b border-gray-700/30 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          {Object.values(characters2035).map((character) => (
            <div 
              key={character.id}
              className={`group cursor-pointer transition-all duration-300 hover:scale-105 ${selectedCharacter === character.id ? 'scale-105' : ''}`}
              onClick={() => handleCharacterSelect(character.id)}
            >
              <div className={`flex flex-col items-center space-y-3 p-4 rounded-2xl backdrop-blur-sm border transition-all ${character.bgGradient} ${character.hoverGradient} ${character.borderColor} ${character.shadowColor} hover:shadow-lg`}>
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br from-${character.color}-400 via-${character.color}-500 to-${character.color}-600 flex items-center justify-center shadow-lg transition-all ${selectedCharacter === character.id ? 'ring-2 ring-white/50' : ''}`}>
                  <span className="text-white font-bold text-lg">{character.name[0]}</span>
                  {selectedCharacter === character.id && (
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl blur"></div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <div className={`${character.accentColor} font-bold text-sm`}>{character.name}</div>
                  <div className="text-gray-400 text-xs">{character.subtitle}</div>
                  <div className="text-gray-500 text-xs italic max-w-24 text-center">{character.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-900/20">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🌌</div>
              <h2 className="text-3xl font-bold text-gray-300 mb-4">欢迎来到2035年的新弧光城</h2>
              <p className="text-gray-400 text-lg mb-2">选择一个意识体开始你的探索之旅</p>
              <p className="text-gray-500">在人机共生的时代，发现真实的自己</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="relative max-w-2xl">
                {message.role === 'user' ? (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl rounded-br-md p-4 shadow-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-white/80 text-xs font-medium">{user}</span>
                      <span className="text-white/60 text-xs ml-auto">{message.timestamp}</span>
                    </div>
                    <p className="text-white leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <div className="flex items-start space-x-4">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.character === 'system' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                      message.character === 'echo' ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                      message.character && characters2035[message.character as keyof typeof characters2035] 
                        ? `bg-gradient-to-br from-${characters2035[message.character as keyof typeof characters2035].color}-400 via-${characters2035[message.character as keyof typeof characters2035].color}-500 to-${characters2035[message.character as keyof typeof characters2035].color}-600`
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      <span className="text-white font-bold">
                        {message.character === 'system' ? '⚡' :
                         message.character === 'echo' ? '🔮' :
                         message.character && characters2035[message.character as keyof typeof characters2035] 
                           ? characters2035[message.character as keyof typeof characters2035].name[0]
                           : 'AI'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-gray-700/50 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold text-sm ${
                            message.character === 'system' ? 'text-gray-300' :
                            message.character === 'echo' ? 'text-violet-400' :
                            message.character && characters2035[message.character as keyof typeof characters2035]
                              ? characters2035[message.character as keyof typeof characters2035].accentColor
                              : 'text-gray-300'
                          }`}>
                            {message.character === 'system' ? '系统引导' :
                             message.character === 'echo' ? '回响之室' :
                             message.character && characters2035[message.character as keyof typeof characters2035]
                               ? characters2035[message.character as keyof typeof characters2035].name
                               : 'AI助手'}
                          </span>
                          <span className="text-gray-500 text-xs">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-4">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-gray-700/50 shadow-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域和控制面板 */}
        <div className="p-6 border-t border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
          {/* 回响之室按钮 */}
          {messages.length > 3 && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={handleEchoRoom}
                disabled={showEchoRoom}
                className="px-6 py-2 bg-gradient-to-r from-violet-600/30 to-purple-600/30 border border-violet-500/30 rounded-full text-violet-300 text-sm hover:from-violet-600/50 hover:to-purple-600/50 transition-all disabled:opacity-50"
              >
                {showEchoRoom ? '🔮 回响分析中...' : '🔮 进入回响之室'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative mb-4">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedCharacter ? `与${characters2035[selectedCharacter as keyof typeof characters2035]?.name || '意识体'}对话...` : "选择一个意识体开始对话..."} 
                className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-lg"
                disabled={!selectedCharacter}
              />
              <button 
                type="submit"
                disabled={!input.trim() || !selectedCharacter || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl flex items-center justify-center transition-all transform hover:scale-105 disabled:scale-100 shadow-lg disabled:opacity-50"
              >
                <span className="text-white text-xl">→</span>
              </button>
            </div>
          </form>
          
          {/* 状态和提示 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-400 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${selectedCharacter ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>{selectedCharacter ? `已连接到${characters2035[selectedCharacter as keyof typeof characters2035]?.name}` : '等待选择意识体'}</span>
              </div>
              <div className="text-gray-500">
                2035新弧光城 · MVP v0.1
              </div>
            </div>
            
            {!selectedCharacter && (
              <p className="text-center text-gray-500 text-sm">
                👆 点击上方任意一个2035年的意识体开始对话
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}