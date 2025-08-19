import { useState, useEffect } from 'react'

interface PlayerBeliefs {
  worldview: string
  selfview: string
  values: string[]
  rules: string[]
}

interface BeliefSystemPanelProps {
  isOpen: boolean
  onClose: () => void
  playerId: string
  characterName: string
  characterPurpose: string
}

export default function BeliefSystemPanel({ 
  isOpen, 
  onClose, 
  playerId, 
  characterName, 
  characterPurpose 
}: BeliefSystemPanelProps) {
  const [beliefs, setBeliefs] = useState<PlayerBeliefs | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageHistoryCount, setMessageHistoryCount] = useState(0)
  const [lastInteraction, setLastInteraction] = useState('')

  // 获取玩家信念状态
  const fetchPlayerBeliefs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/player-beliefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_id: playerId, 
          action: 'get' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBeliefs(data.beliefs)
        setMessageHistoryCount(data.message_history_count)
        setLastInteraction(data.last_interaction || '')
        setMessage(data.message || '')
      } else {
        setMessage('获取信念状态失败')
      }
    } catch (error) {
      console.error('获取信念状态失败:', error)
      setMessage('获取信念状态失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新玩家信念
  const updateBeliefs = async (newBeliefs: Partial<PlayerBeliefs>) => {
    setLoading(true)
    try {
      const response = await fetch('/api/player-beliefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_id: playerId, 
          action: 'update',
          beliefs: newBeliefs
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBeliefs(data.beliefs)
        setMessage(data.message || '信念更新成功')
        // 3秒后清除消息
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('更新信念失败')
      }
    } catch (error) {
      console.error('更新信念失败:', error)
      setMessage('更新信念失败')
    } finally {
      setLoading(false)
    }
  }

  // 重置玩家信念
  const resetBeliefs = async () => {
    if (!confirm('确定要重置所有信念吗？这将清除你当前的信念系统。')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/player-beliefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_id: playerId, 
          action: 'reset'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBeliefs(data.beliefs)
        setMessage(data.message || '信念重置成功')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('重置信念失败')
      }
    } catch (error) {
      console.error('重置信念失败:', error)
      setMessage('重置信念失败')
    } finally {
      setLoading(false)
    }
  }

  // 当面板打开时获取信念状态
  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerBeliefs()
    }
  }, [isOpen, playerId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-600 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 rounded-t-lg p-6 border-b-4 border-amber-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🧠</span>
              <h2 className="text-2xl font-bold text-amber-100 font-serif">信念系统</h2>
            </div>
            <button
              onClick={onClose}
              className="text-amber-200 hover:text-white text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-amber-200 mt-2">
            玩家: {characterName} | 目的: {characterPurpose}
          </p>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-amber-600 mt-4">加载中...</p>
            </div>
          ) : beliefs ? (
            <div className="space-y-6">
              {/* 状态信息 */}
              <div className="bg-amber-200 rounded-lg p-4 border-2 border-amber-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-amber-800">对话次数:</span>
                    <span className="ml-2 text-amber-700">{Math.floor(messageHistoryCount / 2)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800">消息总数:</span>
                    <span className="ml-2 text-amber-700">{messageHistoryCount}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800">最后互动:</span>
                    <span className="ml-2 text-amber-700">
                      {lastInteraction ? new Date(lastInteraction).toLocaleString() : '无'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 世界观 */}
              <div className="space-y-3">
                <label className="block text-amber-800 text-lg font-bold">
                  🌍 世界观
                </label>
                <textarea
                  value={beliefs.worldview}
                  onChange={(e) => setBeliefs({ ...beliefs, worldview: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800 resize-none"
                  rows={3}
                  placeholder="描述你对这个世界的看法..."
                />
                <button
                  onClick={() => updateBeliefs({ worldview: beliefs.worldview })}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  更新世界观
                </button>
              </div>

              {/* 自我认知 */}
              <div className="space-y-3">
                <label className="block text-amber-800 text-lg font-bold">
                  👤 自我认知
                </label>
                <textarea
                  value={beliefs.selfview}
                  onChange={(e) => setBeliefs({ ...beliefs, selfview: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800 resize-none"
                  rows={3}
                  placeholder="描述你如何看待自己..."
                />
                <button
                  onClick={() => updateBeliefs({ selfview: beliefs.selfview })}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  更新自我认知
                </button>
              </div>

              {/* 价值观 */}
              <div className="space-y-3">
                <label className="block text-amber-800 text-lg font-bold">
                  💎 价值观
                </label>
                <div className="space-y-2">
                  {beliefs.values.map((value, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const newValues = [...beliefs.values]
                          newValues[index] = e.target.value
                          setBeliefs({ ...beliefs, values: newValues })
                        }}
                        className="flex-1 px-3 py-2 border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800"
                        placeholder="输入一个价值观..."
                      />
                      <button
                        onClick={() => {
                          const newValues = beliefs.values.filter((_, i) => i !== index)
                          setBeliefs({ ...beliefs, values: newValues })
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setBeliefs({ ...beliefs, values: [...beliefs.values, ''] })}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + 添加价值观
                  </button>
                  <button
                    onClick={() => updateBeliefs({ values: beliefs.values.filter(v => v.trim()) })}
                    className="ml-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    更新价值观
                  </button>
                </div>
              </div>

              {/* 行为准则 */}
              <div className="space-y-3">
                <label className="block text-amber-800 text-lg font-bold">
                  📜 行为准则
                </label>
                <div className="space-y-2">
                  {beliefs.rules.map((rule, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => {
                          const newRules = [...beliefs.rules]
                          newRules[index] = e.target.value
                          setBeliefs({ ...beliefs, rules: newRules })
                        }}
                        className="flex-1 px-3 py-2 border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800"
                        placeholder="输入一个行为准则..."
                      />
                      <button
                        onClick={() => {
                          const newRules = beliefs.rules.filter((_, i) => i !== index)
                          setBeliefs({ ...beliefs, rules: newRules })
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setBeliefs({ ...beliefs, rules: [...beliefs.rules, ''] })}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + 添加行为准则
                  </button>
                  <button
                    onClick={() => updateBeliefs({ rules: beliefs.rules.filter(r => r.trim()) })}
                    className="ml-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    更新行为准则
                  </button>
                </div>
              </div>

              {/* 消息提示 */}
              {message && (
                <div className="p-4 bg-blue-200 rounded-lg border-2 border-blue-300">
                  <p className="text-blue-800 text-center">{message}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={resetBeliefs}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold"
                >
                  🔄 重置信念系统
                </button>
                <button
                  onClick={fetchPlayerBeliefs}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold"
                >
                  🔄 刷新状态
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-amber-600">无法加载信念状态</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
