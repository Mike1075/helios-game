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
    id: 'auto',
    name: '🎯 智能选择',
    role: '自动模式',
    description: 'AI会根据你的话题自动选择最合适的NPC来回应'
  },
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
  const [selectedNpc, setSelectedNpc] = useState<string>('auto')
  const [playerId] = useState(() => `player_${Math.random().toString(36).substr(2, 9)}`)
  const [isLoading, setIsLoading] = useState(false)
  const [isEchoLoading, setIsEchoLoading] = useState(false)
  const [npcDialogueTimer, setNpcDialogueTimer] = useState<NodeJS.Timeout | null>(null)
  const [isNpcDialogueActive, setIsNpcDialogueActive] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [currentNpcSpeakers, setCurrentNpcSpeakers] = useState<{speaker: string, listener: string} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 管理NPC自主对话计时器
  useEffect(() => {
    // 如果用户正在输入，不要启动NPC对话
    if (inputFocused) {
      setIsNpcDialogueActive(false)
      if (npcDialogueTimer) {
        clearTimeout(npcDialogueTimer)
        setNpcDialogueTimer(null)
      }
      return
    }

    // 清理现有计时器
    if (npcDialogueTimer) {
      clearTimeout(npcDialogueTimer)
    }
    
    // 设置新的30秒计时器
    const newTimer = setTimeout(() => {
      setIsNpcDialogueActive(true)
      triggerNpcDialogue()
    }, 30000) // 30秒
    
    setNpcDialogueTimer(newTimer)
    
    // 清理函数
    return () => {
      clearTimeout(newTimer)
    }
  }, [messages.filter(msg => msg.sender === 'player').length, inputFocused]) // 当玩家消息数量变化或焦点状态变化时重置

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    // 停止NPC自主对话
    setIsNpcDialogueActive(false)
    setCurrentNpcSpeakers(null)

    const playerMessage: Message = {
      id: Date.now().toString(),
      sender: 'player',
      content: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, playerMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 调用后端API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          message: input,
          npc_id: selectedNpc === 'auto' ? 'auto' : selectedNpc,
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

  const triggerEcho = async () => {
    if (isEchoLoading) return // 防止重复点击
    
    setIsEchoLoading(true)
    try {
      // 设置更长的超时时间，因为回响之室需要深度AI分析
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          event_id: 'latest'
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

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
      let errorMessage = '回响之室分析失败'
      
      if (error.name === 'AbortError') {
        errorMessage = '回响之室分析超时，请稍后再试'
      } else if (error.message.includes('Network')) {
        errorMessage = 'API连接失败，请检查网络连接'
      }
      
      const fallbackEcho: Message = {
        id: Date.now().toString() + '_echo_fallback',
        sender: 'npc',
        content: `🪞 **回响之室** 🪞\n\n*镜子中的影像模糊不清...* \n\n${errorMessage}`,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, fallbackEcho])
    } finally {
      setIsEchoLoading(false)
    }
  }

  const triggerNpcDialogue = async (continuePreviousConversation = false) => {
    try {
      const response = await fetch('/api/npc-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene_id: 'tavern',
          player_id: playerId
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      // 找到对应的NPC名称
      const speakerName = NPCS.find(npc => npc.id === data.npc_speaker)?.name || data.npc_speaker
      const listenerName = NPCS.find(npc => npc.id === data.npc_listener)?.name || data.npc_listener

      // 记录当前对话的角色
      setCurrentNpcSpeakers({
        speaker: data.npc_speaker,
        listener: data.npc_listener
      })

      // 添加说话者的消息
      const speakerMessage: Message = {
        id: Date.now().toString() + '_npc_speaker',
        sender: 'npc',
        content: data.message,
        npcId: data.npc_speaker,
        npcName: speakerName,
        timestamp: data.timestamp
      }

      // 添加回应者的消息
      const listenerMessage: Message = {
        id: Date.now().toString() + '_npc_listener',
        sender: 'npc',
        content: data.response,
        npcId: data.npc_listener,
        npcName: listenerName,
        timestamp: data.timestamp + 1000
      }

      // 依次添加消息
      setMessages(prev => [...prev, speakerMessage])
      
      // 延迟添加回应消息，模拟真实对话节奏
      setTimeout(() => {
        setMessages(prev => [...prev, listenerMessage])
        
        // 继续对话（如果用户没有开始输入）
        setTimeout(() => {
          if (!inputFocused && isNpcDialogueActive) {
            triggerNpcDialogue(true)
          }
        }, 3000) // 3秒后继续下一轮对话
      }, 2000)

    } catch (error) {
      console.error('Error triggering NPC dialogue:', error)
      setIsNpcDialogueActive(false)
    }
  }


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
                disabled={isEchoLoading}
                className={`w-full mt-4 p-3 rounded-lg font-medium transition-all ${
                  isEchoLoading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                }`}
              >
                {isEchoLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>深度分析中...</span>
                  </div>
                ) : (
                  '🪞 进入回响之室'
                )}
              </button>
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
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={selectedNpc === 'auto' ? '说些什么，AI会帮你找到最合适的聊天对象...' : `对${NPCS.find(n => n.id === selectedNpc)?.name}说些什么...`}
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