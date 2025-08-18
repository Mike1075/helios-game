'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'npc' | 'system'
  content: string
  character?: string
  emotion?: string
  action?: string
  timestamp: Date
}

interface NPCInfo {
  id: string
  name: string
  role: string
  status: string
}

export default function GamePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'system',
      content: '欢迎来到港口酒馆。这里聚集着各种旅行者和当地人，空气中弥漫着酒香和谈话声。你可以与任何人交谈，探索这个世界...',
      timestamp: new Date()
    }
  ])
  
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(`session_${Math.random().toString(36).substr(2, 9)}`)
  const [sceneInfo, setSceneInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // 加载场景信息
    fetchSceneInfo()
  }, [])

  const fetchSceneInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/scene/harbor_tavern/status')
      const data = await response.json()
      if (data.success) {
        setSceneInfo(data.scene)
      }
    } catch (error) {
      console.error('Failed to fetch scene info:', error)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          player_id: 'player_demo', // 演示玩家ID
          scene_id: 'harbor_tavern',
          session_id: sessionId
        })
      })

      const data = await response.json()
      
      if (data.success && data.npc_response) {
        const npcMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'npc',
          content: data.npc_response.message,
          character: data.npc_response.npc_name,
          emotion: data.npc_response.emotion,
          action: data.npc_response.action,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, npcMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `聊天失败: ${data.message || '未知错误'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `网络错误: ${error instanceof Error ? error.message : '连接失败'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const openEchosChamber = async () => {
    const confusion = prompt('描述你当前的困惑或疑问：')
    if (!confusion) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: 'player_demo',
          confusion_text: confusion,
          session_id: sessionId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const echoMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: `🪞 回响之室的洞察：\n\n${data.subjective_attribution}\n\n支撑记忆：\n${data.memory_evidence?.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n') || '无'}\n\n信念洞察：${data.belief_insight || '无'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, echoMessage])
      }
    } catch (error) {
      console.error('Echo chamber error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-3rem)]">
          
          {/* 左侧面板 - 场景信息 */}
          <div className="lg:col-span-1 bg-black/20 backdrop-blur-sm rounded-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-purple-300">场景信息</h3>
            
            {sceneInfo ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-300">{sceneInfo.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{sceneInfo.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-green-300 mb-2">活跃角色</h4>
                  <div className="space-y-1">
                    {sceneInfo.active_npcs?.map((npc: NPCInfo) => (
                      <div key={npc.id} className="text-sm">
                        <span className="text-yellow-300">{npc.name}</span>
                        <span className="text-gray-500 ml-2">({npc.status})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-300 mb-2">氛围</h4>
                  <div className="text-sm space-y-1 text-gray-400">
                    <div>人群密度: {sceneInfo.atmosphere?.crowd_level}</div>
                    <div>噪音水平: {sceneInfo.atmosphere?.noise_level}</div>
                    <div>照明: {sceneInfo.atmosphere?.lighting}</div>
                  </div>
                </div>

                <button
                  onClick={openEchosChamber}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded transition-colors text-sm"
                >
                  🪞 进入回响之室
                </button>
              </div>
            ) : (
              <div className="text-gray-500">加载场景信息中...</div>
            )}
          </div>

          {/* 右侧 - 主聊天界面 */}
          <div className="lg:col-span-3 bg-black/20 backdrop-blur-sm rounded-lg flex flex-col">
            
            {/* 标题栏 */}
            <div className="p-4 border-b border-white/10">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-500 bg-clip-text text-transparent">
                Helios - 意识的棱镜
              </h1>
              <p className="text-sm text-gray-400 mt-1">Session: {sessionId}</p>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.type === 'npc'
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    {message.character && (
                      <div className="text-xs text-gray-300 mb-1 font-semibold">
                        {message.character}
                        {message.emotion && <span className="ml-2 text-yellow-300">({message.emotion})</span>}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.action && (
                      <div className="text-xs text-purple-300 mt-1 italic">
                        *{message.action}*
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>AI思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t border-white/10">
              <div className="flex space-x-2">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="输入你的消息... (Enter发送, Shift+Enter换行)"
                  className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !currentMessage.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors font-medium"
                >
                  发送
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                在这个意识探索沙盒中，你的每一句话都在塑造独特的信念系统...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}