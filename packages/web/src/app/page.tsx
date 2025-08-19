'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  sender: 'player' | 'npc'
  content: string
  npcId?: string
  npcName?: string
  timestamp: number
}

interface NPC {
  id: string
  name: string
  role: string
  description: string
}

const NPCS: NPC[] = [
  {
    id: 'guard_alvin',
    name: '艾尔文',
    role: '城卫兵',
    description: '严谨的港口守卫，维护着这里的秩序'
  },
  {
    id: 'wanderer_karin',
    name: '卡琳',
    role: '流浪者',
    description: '警觉的流浪者，似乎对每个人都保持着戒备'
  },
  {
    id: 'scholar_thane',
    name: '塞恩',
    role: '学者',
    description: '博学的学者，总是埋首于古老的书籍中'
  }
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'npc',
      content: '*你走进了港口酒馆，烛光摇曳，各种人物在此聚集...*',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [selectedNpc, setSelectedNpc] = useState<string>('guard_alvin')
  const [playerId] = useState(() => `player_${Math.random().toString(36).substr(2, 9)}`)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(false) // 自动对话模式
  const [autoInterval, setAutoInterval] = useState<NodeJS.Timeout | null>(null) // 自动对话定时器
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送玩家消息
  const sendMessage = async (userMessage?: string) => {
    const messageToSend = userMessage || input
    if (!messageToSend.trim() || isLoading) return

    // 只有在不是自动模式或者是用户主动发送时才添加玩家消息
    if (!userMessage) {
      const playerMessage: Message = {
        id: Date.now().toString(),
        sender: 'player',
        content: messageToSend,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, playerMessage])
      setInput('')
    }
    
    setIsLoading(true)

    try {
      // 调用后端API
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api/chat' : '/api/chat'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          message: messageToSend,
          npc_id: selectedNpc,
          scene_id: 'tavern'
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      const npc = NPCS.find(n => n.id === data.npc_id)

      const npcMessage: Message = {
        id: Date.now().toString() + '_npc',
        sender: 'npc',
        content: data.response,
        npcId: data.npc_id,
        npcName: npc?.name,
        timestamp: data.timestamp
      }

      setMessages(prev => [...prev, npcMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      // 本地开发时的fallback响应
      const npc = NPCS.find(n => n.id === selectedNpc)
      const fallbackMessage: Message = {
        id: Date.now().toString() + '_fallback',
        sender: 'npc',
        content: `*${npc?.name}看着你，但似乎听不清你在说什么...* (API连接失败，这在本地开发时是正常的)`,
        npcId: selectedNpc,
        npcName: npc?.name,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 触发NPC自主对话
  const triggerNpcDialogue = async () => {
    if (isLoading) return
    
    // 让NPC基于当前对话继续说话
    const contextPrompt = "请基于之前的对话继续你的想法，或者提出新的话题。不需要等待玩家回应，继续表达你角色的观点和感受。"
    await sendMessage(contextPrompt)
  }

  const triggerEcho = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api/echo' : '/api/echo'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          event_id: 'latest'
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      const echoMessage: Message = {
        id: Date.now().toString() + '_echo',
        sender: 'npc',
        content: `🪞 **回响之室** 🪞\n\n${data.attribution}\n\n**记忆片段：**\n${data.memory_evidence.map((evidence: string) => `• ${evidence}`).join('\n')}`,
        timestamp: data.timestamp
      }

      setMessages(prev => [...prev, echoMessage])
    } catch (error) {
      console.error('Error triggering echo:', error)
      const fallbackEcho: Message = {
        id: Date.now().toString() + '_echo_fallback',
        sender: 'npc',
        content: '🪞 **回响之室** 🪞\n\n*镜子中的影像模糊不清...* (API连接失败)',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, fallbackEcho])
    }
  }

  // 开启/关闭自动对话模式
  const toggleAutoMode = () => {
    if (isAutoMode) {
      // 关闭自动模式
      if (autoInterval) {
        clearInterval(autoInterval)
        setAutoInterval(null)
      }
      setIsAutoMode(false)
    } else {
      // 开启自动模式
      setIsAutoMode(true)
      const interval = setInterval(() => {
        triggerNpcDialogue()
      }, 3000) // 每3秒触发一次NPC对话
      setAutoInterval(interval)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoInterval) {
        clearInterval(autoInterval)
      }
    }
  }, [autoInterval])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Helios - 港口酒馆
          </h1>
          <p className="text-lg text-blue-200">
            意识的棱镜 - 在这里发现你真实的信念
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* NPC选择面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">酒馆中的人物</h3>
              <div className="space-y-3">
                {NPCS.map((npc) => (
                  <button
                    key={npc.id}
                    onClick={() => setSelectedNpc(npc.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedNpc === npc.id
                        ? 'bg-purple-600/50 border-2 border-purple-400'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{npc.name}</div>
                    <div className="text-sm text-gray-300">{npc.role}</div>
                    <div className="text-xs text-gray-400 mt-1">{npc.description}</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={triggerEcho}
                className="w-full mt-4 p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                🪞 进入回响之室
              </button>
              
              {/* 自动对话控制 */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={toggleAutoMode}
                  className={`w-full p-3 rounded-lg font-medium transition-all ${
                    isAutoMode 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isAutoMode ? '🛑 停止自动对话' : '🤖 开启自动对话'}
                </button>
                
                <button
                  onClick={triggerNpcDialogue}
                  disabled={isLoading}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                >
                  💬 手动触发对话
                </button>
              </div>
            </div>
          </div>

          {/* 聊天区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 h-[600px] flex flex-col">
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'player'
                          ? 'bg-blue-600/50 text-white'
                          : 'bg-gray-700/50 text-gray-100'
                      }`}
                    >
                      {message.sender === 'npc' && message.npcName && (
                        <div className="text-sm font-medium text-yellow-300 mb-1">
                          {message.npcName}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700/50 text-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入区域 */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`对${NPCS.find(n => n.id === selectedNpc)?.name}说些什么...`}
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}