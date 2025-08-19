import { useState, useRef, useEffect } from 'react'
import CharacterPanel from './CharacterPanel'
import BeliefSystemPanel from './BeliefSystemPanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  characterName?: string
  characterId?: string
}

interface ChatInterfaceProps {
  characterName: string;
  characterPurpose: string;
}

// 角色配置
const CHARACTERS = {
  guard_elvin: {
    name: "卫兵艾尔文",
    avatar: "🛡️",
    color: "bg-blue-600",
    borderColor: "border-blue-400",
    bgColor: "bg-blue-50"
  },
  priestess_lila: {
    name: "祭司莉拉",
    avatar: "⛪",
    color: "bg-purple-600",
    borderColor: "border-purple-400",
    bgColor: "bg-purple-50"
  },
  merchant_karl: {
    name: "商人卡尔",
    avatar: "💰",
    color: "bg-yellow-600",
    borderColor: "border-yellow-400",
    bgColor: "bg-yellow-50"
  },
  sailor_maya: {
    name: "水手玛雅",
    avatar: "⚓",
    color: "bg-teal-600",
    borderColor: "border-teal-400",
    bgColor: "bg-teal-50"
  }
}

export default function ChatInterface({ characterName, characterPurpose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState('guard_elvin')
  const [showCharacterPanel, setShowCharacterPanel] = useState(false)
  const [showBeliefSystem, setShowBeliefSystem] = useState(false)
  const [playerId, setPlayerId] = useState(`player_${characterName}_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          player_id: playerId,
          characterName: characterName,
          characterPurpose: characterPurpose
        })
      })

      if (!response.ok) throw new Error('API调用失败')

      const data = await response.json()
      
      // 根据角色名称确定角色ID
      const characterId = Object.keys(CHARACTERS).find(key => 
        CHARACTERS[key as keyof typeof CHARACTERS].name === data.character_name
      ) || 'guard_elvin'
      
      setCurrentCharacter(characterId)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        characterName: data.character_name,
        characterId: characterId
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在无法回应。请稍后再试。',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const getCharacterInfo = (characterId?: string) => {
    if (!characterId) return CHARACTERS.guard_elvin
    return CHARACTERS[characterId as keyof typeof CHARACTERS] || CHARACTERS.guard_elvin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700">
      {/* 背景装饰 */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 rounded-t-lg shadow-2xl border-b-4 border-amber-600">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🏰</span>
                <h1 className="text-3xl font-bold text-amber-100 font-serif">赫利俄斯港口酒馆</h1>
                <span className="text-3xl">🏰</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCharacterPanel(true)}
                  className="px-4 py-2 bg-amber-600 text-amber-100 rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>👥</span>
                  <span>角色介绍</span>
                </button>
                <button
                  onClick={() => setShowBeliefSystem(true)}
                  className="px-4 py-2 bg-purple-600 text-purple-100 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>🧠</span>
                  <span>信念系统</span>
                </button>
              </div>
            </div>
            <p className="text-amber-200 text-lg font-medium text-center">故事开始于一个昏暗的酒馆角落...</p>
            <div className="mt-3 flex items-center justify-center space-x-6 text-sm text-amber-300">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400">👤</span>
                <span>{characterName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-400">🎯</span>
                <span>{characterPurpose}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-b-lg shadow-2xl border-x-4 border-b-4 border-amber-600">
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍺</div>
                <h3 className="text-xl font-bold text-amber-800 mb-2">欢迎来到赫利俄斯港口酒馆</h3>
                <p className="text-amber-600">在这里，每个角落都藏着故事，每个人都有自己的秘密...</p>
                <p className="text-amber-500 text-sm mt-2">开始你的对话吧！</p>
              </div>
            )}
            
            {messages.map((message) => {
              const characterInfo = getCharacterInfo(message.characterId)
              
              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                    message.role === 'user' ? 'message-user' : 'message-assistant'
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 glow ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : `${characterInfo.bgColor} ${characterInfo.borderColor} border-2 text-gray-800`
                    }`}
                  >
                    {message.characterName && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl character-avatar">{characterInfo.avatar}</span>
                        <span className={`font-bold text-sm ${characterInfo.color.replace('bg-', 'text-')}`}>
                          {message.characterName}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {loading && (
              <div className="flex justify-start message-assistant">
                <div className={`${getCharacterInfo(currentCharacter).bgColor} ${getCharacterInfo(currentCharacter).borderColor} border-2 px-4 py-3 rounded-2xl shadow-lg glow`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl character-avatar">{getCharacterInfo(currentCharacter).avatar}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bounce-dot w-2 h-2 bg-gray-600 rounded-full"></div>
                      <div className="bounce-dot w-2 h-2 bg-gray-600 rounded-full"></div>
                      <div className="bounce-dot w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t-4 border-amber-600 p-6 bg-gradient-to-r from-amber-100 to-amber-200">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="你想说什么..."
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800 placeholder-amber-600 font-medium"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400">
                  {input.length}/500
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold"
              >
                {loading ? '发送中...' : '发送'}
              </button>
            </div>
            
            {/* 快捷提示 */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-amber-700 font-medium">试试说：</span>
              {['你好', '这里有什么故事？', '能告诉我一些秘密吗？', '我想了解这个地方'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm hover:bg-amber-300 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 角色面板 */}
      <CharacterPanel
        isOpen={showCharacterPanel}
        onClose={() => setShowCharacterPanel(false)}
        currentCharacter={currentCharacter}
      />

      {/* 信念系统面板 */}
      <BeliefSystemPanel
        isOpen={showBeliefSystem}
        onClose={() => setShowBeliefSystem(false)}
        playerId={playerId}
        characterName={characterName}
        characterPurpose={characterPurpose}
      />
    </div>
  )
}
