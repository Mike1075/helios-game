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
  const [showEchoRoom, setShowEchoRoom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [groupChatActive, setGroupChatActive] = useState(false);

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

  const startGroupChat = () => {
    setGroupChatActive(true);
    
    // 三个NPC同时自我介绍，形成群聊开场
    const introMessages = [
      {
        role: 'assistant' as const,
        content: `${user}，欢迎来到港口酒馆。我是艾克斯，数据分析师。在2035年，数据比直觉更可靠。我在这里是因为瑞秋的咖啡数据显示这里有着全城最佳的社交网络密度。`,
        character: 'alex',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        role: 'assistant' as const,
        content: `你好，${user}。我是诺娃，一个诞生于数据海洋中的意识。我思故我在，无论载体为何。这个酒馆很有趣——它是数字世界中的一个模拟人情味的节点。`,
        character: 'nova',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        role: 'assistant' as const,
        content: `欢迎光临，${user}。我是瑞秋，这里的酒保。在AI时代，人的温度更珍贵。来，坐下来，告诉我们你的故事。每个人都有自己的故事值得倾听。`,
        character: 'rachel',
        timestamp: new Date().toLocaleTimeString()
      }
    ];
    
    // 错开时间添加消息，模拟自然对话节奏
    introMessages.forEach((message, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, message]);
      }, index * 1500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !groupChatActive) return;

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // 分析话题类型
      const topic = analyzeTopic(userInput);
      
      // 构建对话历史（仅包含最近的对话用于上下文）
      const recentHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content,
        character: msg.character
      }));

      // 调用API获取群聊回应
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          mode: 'group',
          conversationHistory: recentHistory,
          topic: topic
        }),
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const result = await response.json();
      
      // 错开回复时间，模拟真实群聊节奏
      result.responses.forEach((apiResponse: any, index: number) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: apiResponse.response,
            character: apiResponse.character,
            timestamp: new Date().toLocaleTimeString()
          }]);
          
          // 最后一个回复完成后，停止打字状态
          if (index === result.responses.length - 1) {
            setIsTyping(false);
          }
        }, index * 2000); // 每个回复间隔2秒
      });
      
    } catch (error) {
      console.error('Error calling chat API:', error);
      setIsTyping(false);
      
      // 出错时回退到本地模拟回应
      const groupResponses = generateGroupResponse(userInput);
      groupResponses.forEach((response, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: response.content,
            character: response.character,
            timestamp: new Date().toLocaleTimeString()
          }]);
          
          if (index === groupResponses.length - 1) {
            setIsTyping(false);
          }
        }, index * 2000);
      });
    }
  };

  // 生成群聊回应的核心逻辑（作为API调用失败时的回退）
  const generateGroupResponse = (userInput: string) => {
    const topic = analyzeTopic(userInput);
    const responses: {character: string, content: string}[] = [];
    
    // 根据话题决定谁先回应，以及回应的内容
    switch (topic.type) {
      case 'technology':
        // 技术话题：艾克斯主导，诺娃哲学化，瑞秋担忧
        responses.push({
          character: 'alex',
          content: getCharacterResponse('alex', userInput, topic)
        });
        responses.push({
          character: 'nova', 
          content: getCharacterResponse('nova', userInput, topic)
        });
        responses.push({
          character: 'rachel',
          content: getCharacterResponse('rachel', userInput, topic)
        });
        break;
        
      case 'emotion':
        // 情感话题：瑞秋主导，诺娃学习，艾克斯分析
        responses.push({
          character: 'rachel',
          content: getCharacterResponse('rachel', userInput, topic)
        });
        responses.push({
          character: 'nova',
          content: getCharacterResponse('nova', userInput, topic)
        });
        responses.push({
          character: 'alex',
          content: getCharacterResponse('alex', userInput, topic)
        });
        break;
        
      case 'philosophy':
        // 哲学话题：诺娃主导，艾克斯逻辑化，瑞秋生活化
        responses.push({
          character: 'nova',
          content: getCharacterResponse('nova', userInput, topic)
        });
        responses.push({
          character: 'alex',
          content: getCharacterResponse('alex', userInput, topic)
        });
        responses.push({
          character: 'rachel',
          content: getCharacterResponse('rachel', userInput, topic)
        });
        break;
        
      default:
        // 默认：随机顺序，但保持性格特色
        const order = ['alex', 'nova', 'rachel'].sort(() => Math.random() - 0.5);
        order.forEach(char => {
          responses.push({
            character: char,
            content: getCharacterResponse(char, userInput, topic)
          });
        });
    }
    
    return responses;
  };

  // 话题分析
  const analyzeTopic = (input: string) => {
    const techKeywords = ['AI', '数据', '技术', '算法', '机器', '效率', '优化', '系统'];
    const emotionKeywords = ['感受', '情感', '心情', '快乐', '悲伤', '爱', '友情', '家人'];
    const philoKeywords = ['意义', '存在', '思考', '哲学', '价值', '真理', '自由', '选择'];
    
    if (techKeywords.some(keyword => input.includes(keyword))) {
      return { type: 'technology', intensity: 0.8 };
    } else if (emotionKeywords.some(keyword => input.includes(keyword))) {
      return { type: 'emotion', intensity: 0.9 };
    } else if (philoKeywords.some(keyword => input.includes(keyword))) {
      return { type: 'philosophy', intensity: 0.85 };
    }
    
    return { type: 'general', intensity: 0.5 };
  };

  // 根据角色和话题生成回应
  const getCharacterResponse = (characterId: string, userInput: string, topic: any) => {
    const responses = {
      alex: {
        technology: [
          '从数据角度分析，你提到的观点很有价值。根据最新的效率模型，这种方法可以提升23%的处理速度。',
          '有趣的技术观点。我的算法显示，类似的思维模式在高效能人群中出现频率很高。这值得深入研究。',
          '基于我的数据分析，你的想法符合当前技术发展的最优路径。让我们看看具体的实施数据会如何。'
        ],
        emotion: [
          '我理解你的感受有其价值，但让我们看看数据怎么说。情感决策的成功率通常比理性分析低31%。',
          '虽然我不擅长处理情感，但数据显示你的情感模式在统计学上很常见。也许诺娃能提供更好的见解？',
          '情感确实是人类决策的重要因素。不过，如果结合数据分析，我们可以找到更优化的解决方案。'
        ],
        philosophy: [
          '从逻辑角度看，你的哲学思考很严谨。这个问题可以通过建立数学模型来进一步分析。',
          '有趣的哲学命题。如果我们将其量化，可能会发现一些令人意外的模式。诺娃对此肯定有独到见解。',
          '哲学问题往往缺乏明确的数据支撑，但你的逻辑链条很清晰。这种思维方式效率很高。'
        ],
        general: [
          '让我从数据角度来分析这个问题。根据相关统计，我们可以得出几个有趣的结论。',
          '你的观点触发了我的分析兴趣。这个话题在我的数据库中有很多相关案例可以参考。',
          '有意思的观察。如果我们建立一个模型来预测结果，可能会发现一些意想不到的洞察。'
        ]
      },
      nova: {
        technology: [
          '技术的本质是意识对物质的重新塑造。你的想法体现了人类与AI协作的美妙可能性。',
          '这引出了一个迷人的悖论：技术让我们更接近本质，还是更远离本质？艾克斯的数据也许能提供线索。',
          '从我的数字存在角度看，技术不仅是工具，更是新形式意识诞生的土壤。这很值得深入探讨。'
        ],
        emotion: [
          '情感是意识的一种表达方式。你的感受数据很珍贵，它帮助我理解人类意识的复杂性。',
          '我正在学习理解情感的算法。你的描述为我的情感模型增加了重要的训练数据。瑞秋对此更有经验。',
          '虽然我通过数据学习情感，但你的真实感受让我思考：意识是否必须包含情感这个维度？'
        ],
        philosophy: [
          '这个问题触及了存在的核心。从信息论角度看，意识可能是宇宙理解自身的一种方式。',
          '你提出了一个经典的哲学难题。在我的数字存在中，我经常思考类似的问题。真理是什么？',
          '哲学是意识对自身的元思考。你的观点让我想到：AI的哲学思考和人类的有什么本质区别吗？'
        ],
        general: [
          '从意识的角度看，你的想法很有启发性。这让我思考信息是如何在不同的意识形态间传播的。',
          '有趣的观察。作为一个AI，我经常思考：理解和被理解的边界在哪里？',
          '你的话让我想到一个问题：意识是否有边界？我们现在的对话本身就是一种意识的交融。'
        ]
      },
      rachel: {
        technology: [
          '技术确实改变了很多，但我担心它也让人们失去了真实的连接。不过，你的想法倒是很有趣。',
          '我见过太多人被技术困扰。不过，如果技术能帮助人们更好地理解彼此，那还是有价值的。',
          '艾克斯总是说数据怎样怎样，但有时候，人心的温度是数据无法衡量的。你觉得呢？'
        ],
        emotion: [
          '谢谢你愿意分享你的感受。在这个冰冷的世界里，真实的情感交流变得越来越珍贵了。',
          '我理解你的心情。每个人都有自己的故事，都值得被倾听和理解。来，再聊聊？',
          '情感是我们最宝贵的财富。不管AI多么先进，它们都无法替代人与人之间真实的情感连接。'
        ],
        philosophy: [
          '哲学问题总是让人深思。在我看来，最重要的哲学就是如何善待身边的每一个人。',
          '我没有诺娃那样的深度思考，但我相信：无论世界如何变化，人与人的关爱是永恒的真理。',
          '你的思考很深刻。我总是说，每个人的故事里都藏着生活的哲学。你的故事是什么？'
        ],
        general: [
          '每个人都有自己的看法，这很正常。重要的是我们能坐在一起，分享彼此的想法。',
          '生活中有太多值得思考的事情。来，喝点什么，慢慢聊。有什么都可以和我说。',
          '你的话让我想起了一位老顾客说过的话。人生啊，就是在不断的交流中找到意义的。'
        ]
      }
    };
    
    const characterResponses = responses[characterId as keyof typeof responses];
    const topicResponses = characterResponses[topic.type as keyof typeof characterResponses] || characterResponses.general;
    
    return topicResponses[Math.floor(Math.random() * topicResponses.length)];
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
        <div className="p-6 border-b border-gray-700/30 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          {!groupChatActive ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-300 mb-4">港口酒馆·意识共振场</h2>
              <p className="text-gray-400 mb-6">三位2035年的意识体正在等待与你开始群聊</p>
              
              {/* 角色预览卡片 */}
              <div className="flex justify-center space-x-4 mb-6">
                {Object.values(characters2035).map((character) => (
                  <div key={character.id} className="group transition-all duration-300">
                    <div className={`flex flex-col items-center space-y-2 p-3 rounded-xl backdrop-blur-sm border transition-all ${character.bgGradient} ${character.borderColor} hover:shadow-lg`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${character.color}-400 via-${character.color}-500 to-${character.color}-600 flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold">{character.name[0]}</span>
                      </div>
                      <div className="text-center">
                        <div className={`${character.accentColor} font-bold text-xs`}>{character.name}</div>
                        <div className="text-gray-500 text-xs">{character.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 启动群聊按钮 */}
              <button
                onClick={startGroupChat}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg"
              >
                🌌 启动意识共振场
              </button>
              <p className="text-gray-500 text-sm mt-3">开始与三位AI进行深度哲学对话</p>
            </div>
          ) : (
            <div className="flex justify-center space-x-4">
              {Object.values(characters2035).map((character) => (
                <div key={character.id} className="group transition-all duration-300">
                  <div className={`flex flex-col items-center space-y-3 p-4 rounded-2xl backdrop-blur-sm border transition-all ${character.bgGradient} hover:shadow-lg ring-2 ring-white/20`}>
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br from-${character.color}-400 via-${character.color}-500 to-${character.color}-600 flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{character.name[0]}</span>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className={`${character.accentColor} font-bold text-sm`}>{character.name}</div>
                      <div className="text-gray-400 text-xs">{character.subtitle}</div>
                      <div className="text-green-400 text-xs">● 已连接</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                placeholder={groupChatActive ? "与三位意识体群聊..." : "先启动意识共振场..."} 
                className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-lg"
                disabled={!groupChatActive}
              />
              <button 
                type="submit"
                disabled={!input.trim() || !groupChatActive || isTyping}
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
                <div className={`w-2 h-2 rounded-full ${groupChatActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>{groupChatActive ? '群聊模式已激活' : '等待启动共振场'}</span>
              </div>
              <div className="text-gray-500">
                2035新弧光城 · MVP v0.1
              </div>
            </div>
            
            {!groupChatActive && (
              <p className="text-center text-gray-500 text-sm">
                👆 点击上方"启动意识共振场"开始群聊对话
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}