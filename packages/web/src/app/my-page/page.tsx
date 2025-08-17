'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  speaker: 'player' | 'elara' | 'marcus'
  content: string
  timestamp: number
}

interface NPC {
  id: string
  name: string
  role: string
  avatar: string
  coreMotivation: string
  currentMood: string
}

export default function HeliosChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const npcs: NPC[] = [
    {
      id: 'elara',
      name: '埃拉拉',
      role: '酒馆老板娘',
      avatar: '🌙',
      coreMotivation: '帮助他人找到内心的光明',
      currentMood: '温和而智慧'
    },
    {
      id: 'marcus', 
      name: '马库斯',
      role: '哲学家诗人',
      avatar: '📜',
      coreMotivation: '质疑现实的本质',
      currentMood: '深沉而挑战性'
    }
  ]

  // 修复hydration错误：在客户端初始化消息
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        speaker: 'elara',
        content: '欢迎来到夜光酒馆，旅者。我是埃拉拉，这里的老板娘。你看起来像是有故事的人...',
        timestamp: Date.now() - 60000
      },
      {
        id: '2', 
        speaker: 'marcus',
        content: '又来了一个迷失的灵魂。我是马库斯，这里的常客。告诉我，你相信命运吗？',
        timestamp: Date.now() - 30000
      }
    ]
    setMessages(initialMessages)
    setIsInitialized(true)
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      speaker: 'player',
      content: inputMessage,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, newMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // 尝试调用后端API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: 'player_001',
          message: currentMessage,
          target_npc: null
        })
      })

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      const npcMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: data.npc_id as 'elara' | 'marcus',
        content: data.response,
        timestamp: data.timestamp * 1000
      }

      setMessages(prev => [...prev, npcMessage])
      
    } catch (error) {
      console.log('API调用失败，使用智能fallback:', error)
      
      // 智能Fallback: 基于用户输入生成更智能的响应
      const respondingNPC = Math.random() > 0.5 ? npcs[0] : npcs[1]
      
      // 根据用户输入的关键词生成更相关的响应
      const userInput = currentMessage.toLowerCase()
      let response = ''
      
      if (respondingNPC.id === 'elara') {
        if (userInput.includes('困难') || userInput.includes('痛苦') || userInput.includes('难过')) {
          response = '我理解你的感受，亲爱的旅者。每一份痛苦都是成长的养分，虽然此刻可能难以察觉。'
        } else if (userInput.includes('快乐') || userInput.includes('高兴') || userInput.includes('开心')) {
          response = '看到你眼中的光芒真是太好了！快乐就像这酒馆里的温暖灯火，照亮着每一个角落。'
        } else if (userInput.includes('迷茫') || userInput.includes('不知道') || userInput.includes('困惑')) {
          response = '迷茫是探索的开始，不是终点。你的内心已经知道答案，只是需要时间去倾听。'
        } else {
          const responses = [
            '你的话触动了我内心深处的共鸣。每个人都在寻找属于自己的光芒。',
            '我在你的声音中听到了故事，那些塑造了今天的你的珍贵经历。',
            '这个世界有时让人感到复杂，但请记住，理解总是比批判更有力量。'
          ]
          response = responses[Math.floor(Math.random() * responses.length)]
        }
      } else { // marcus
        if (userInput.includes('相信') || userInput.includes('信念') || userInput.includes('觉得')) {
          response = '有趣。你刚才的表达揭示了你对现实本质的某种假设。你是否意识到这一点？'
        } else if (userInput.includes('为什么') || userInput.includes('原因') || userInput.includes('怎么')) {
          response = '问题的本质不在于答案，而在于我们为什么会问这样的问题。这说明了什么？'
        } else if (userInput.includes('现实') || userInput.includes('世界') || userInput.includes('真实')) {
          response = '我们所谓的"现实"，究竟是客观存在，还是我们信念系统的投射？这值得深思。'
        } else {
          const responses = [
            '你说的话让我思考：我们是在创造现实，还是现实在塑造我们？',
            '我听到了你的话，但更重要的是，你听到了自己内心深处的声音吗？',
            '这引发了一个哲学命题：感知是现实的镜子，还是现实是感知的产物？'
          ]
          response = responses[Math.floor(Math.random() * responses.length)]
        }
      }

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: respondingNPC.id as 'elara' | 'marcus',
        content: `${response} ${Math.random() > 0.7 ? '(本地模拟模式)' : ''}`,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const getSpeakerStyle = (speaker: string) => {
    switch (speaker) {
      case 'player':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-500/30'
      case 'elara':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900 border-2 border-purple-300/50'
      case 'marcus':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border-2 border-amber-300/50'
      default:
        return 'bg-gray-100 border-2 border-gray-300'
    }
  }

  const getSpeakerName = (speaker: string) => {
    switch (speaker) {
      case 'player':
        return '你'
      case 'elara':
        return '🌙 埃拉拉'
      case 'marcus':
        return '📜 马库斯'
      default:
        return speaker
    }
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* 自定义滚动条 */
        #chat-container::-webkit-scrollbar {
          width: 6px;
        }
        #chat-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        #chat-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        #chat-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      {/* 顶部场景描述 */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🏛️ 夜光酒馆 - 大呲花的测试
            </h1>
            <p className="text-blue-200 max-w-2xl mx-auto">
              在这个充满神秘色彩的酒馆里，你遇到了两位独特的NPC。他们的回应将反映你内心深处的信念系统...
            </p>
          </div>
        </div>
      </div>

      {/* NPC信息面板 */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {npcs.map(npc => (
              <div key={npc.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{npc.avatar}</span>
      <div>
                    <h3 className="text-white font-semibold">{npc.name}</h3>
                    <p className="text-sm text-blue-200">{npc.role}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      核心动机: {npc.coreMotivation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* 消息历史 */}
          <div className="h-96 overflow-y-auto p-6 space-y-4" id="chat-container">
            {!isInitialized ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className={`flex ${message.speaker === 'player' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 ${getSpeakerStyle(message.speaker)}`}>
                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                      {message.speaker !== 'player' && (
                        <span className="text-lg">
                          {message.speaker === 'elara' ? '🌙' : '📜'}
                        </span>
                      )}
                      {getSpeakerName(message.speaker)}
                    </div>
                    <div className="text-sm leading-relaxed break-words">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2 text-right">
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-4 py-3 rounded-2xl shadow-lg border-2 border-gray-300/50 max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">🤔</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">AI正在思考中...</span>
                      <div className="flex gap-1 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="border-t border-white/10 p-4 bg-gradient-to-r from-black/20 to-black/10">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="在这里输入你的话语... (Enter发送)"
                  className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border-2 border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                  disabled={isTyping}
                  maxLength={500}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {inputMessage.length}/500
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/25 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
              >
                {isTyping ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>发送中</span>
                  </div>
                ) : (
                  '发送'
                )}
              </button>
            </div>
            
            {/* 状态提示 */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-gray-400">
                🔄 本地开发模式 - 使用模拟数据
              </div>
              <div className="text-gray-400">
                完整功能请在Vercel预览环境测试
              </div>
            </div>
          </div>
        </div>

        {/* 信念系统提示 */}
        <div className="mt-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-lg">
            🔮 意识的棱镜
          </h3>
          <div className="space-y-2">
            <p className="text-blue-200 text-sm leading-relaxed">
              每个NPC的回应都源于其独特的信念系统。你的话语将通过他们的"信念棱镜"折射，产生高度主观的解读。
            </p>
            <p className="text-purple-200 text-sm leading-relaxed">
              当出现认知失调时，你将有机会进入"回响之室"进行深度自省，理解自己的信念如何塑造对现实的感知...
            </p>
          </div>
          
          {/* 小提示 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/20">
              💫 主观体验
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/20">
              🌟 信念演化
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/20">
              🔄 认知失调
            </span>
          </div>
        </div>
      </div>
    </div>
  )
  }