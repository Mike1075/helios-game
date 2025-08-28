'use client'

import { useState, useRef } from 'react'

interface SSEMessage {
  type: string
  stage?: string
  status: string
  content?: string
  message?: string
  progress?: number
  timestamp: string
  sessionId?: string
}

export default function TestRealSSE() {
  const [messages, setMessages] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentStage, setCurrentStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentSessionRef = useRef<string>('')

  const userId = '6a477327-52ae-4853-afda-4e53d5760ad0' // 测试用户ID

  // 建立SSE连接
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    currentSessionRef.current = newSessionId
    
    const sseUrl = `/api/sse-stream?userId=${userId}&sessionId=${newSessionId}`
    console.log('建立SSE连接:', sseUrl)
    
    setConnectionStatus('connecting')
    setMessages(prev => [...prev, `🔄 正在建立SSE连接... (${newSessionId})`])

    const eventSource = new EventSource(sseUrl)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE连接已建立')
      setConnectionStatus('connected')
      setIsConnected(true)
      setMessages(prev => [...prev, '✅ SSE连接已建立'])
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)
        console.log('收到SSE消息:', data)
        
        handleSSEMessage(data)
      } catch (error) {
        console.error('解析SSE消息失败:', error, event.data)
        setMessages(prev => [...prev, `❌ 解析错误: ${event.data}`])
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error)
      setConnectionStatus('error')
      setMessages(prev => [...prev, '❌ SSE连接错误'])
      
      // 自动重连
      setTimeout(() => {
        if (currentSessionRef.current === newSessionId) {
          setMessages(prev => [...prev, '🔄 尝试重新连接...'])
          connectSSE()
        }
      }, 3000)
    }

    // EventSource没有onclose事件，连接关闭会通过onerror处理
  }

  // 处理SSE消息
  const handleSSEMessage = (data: SSEMessage) => {
    const timestamp = new Date(data.timestamp).toLocaleTimeString()
    
    switch (data.type) {
      case 'connection':
        setMessages(prev => [...prev, `[${timestamp}] 🔗 ${data.message}`])
        break
        
      case 'consciousness_start':
        setMessages(prev => [...prev, `[${timestamp}] 🧠 ${data.message}`])
        setProgress(0)
        setCurrentStage('开始')
        break
        
      case 'stage_update':
        setCurrentStage(data.stage || '')
        setProgress(data.progress || 0)
        
        const stageLabel = getStageLabel(data.stage || '')
        const statusIcon = data.status === 'processing' ? '⏳' : 
                          data.status === 'completed' ? '✅' : 
                          data.status === 'error' ? '❌' : '🔄'
        
        setMessages(prev => [...prev, 
          `[${timestamp}] ${statusIcon} ${stageLabel}: ${data.content || data.message}`
        ])
        break
        
      case 'session_complete':
        setMessages(prev => [...prev, `[${timestamp}] 🎉 意识转化完成!`])
        setMessages(prev => [...prev, `📋 最终结果:\n${data.content}`])
        setProgress(100)
        setCurrentStage('完成')
        break
        
      case 'error':
        setMessages(prev => [...prev, `[${timestamp}] ❌ 错误: ${data.message}`])
        break
        
      default:
        setMessages(prev => [...prev, `[${timestamp}] 📨 ${JSON.stringify(data)}`])
    }
  }

  // 触发意识转化
  const triggerConsciousness = async () => {
    if (!sessionId) {
      setMessages(prev => [...prev, '❌ 请先建立SSE连接'])
      return
    }

    const message = '我想变得更自信'
    setMessages(prev => [...prev, `🚀 触发意识转化: "${message}"`])

    try {
      const response = await fetch('/api/trigger-consciousness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId,
          message
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessages(prev => [...prev, `✅ 意识转化已触发: ${result.message}`])
      } else {
        setMessages(prev => [...prev, `❌ 触发失败: ${result.error}`])
      }
    } catch (error) {
      console.error('触发意识转化失败:', error)
      const errorMessage = error instanceof Error ? error.message : '触发异常'
      setMessages(prev => [...prev, `❌ 触发异常: ${errorMessage}`])
    }
  }

  // 断开连接
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setSessionId('')
    setCurrentStage('')
    setProgress(0)
    currentSessionRef.current = ''
    setMessages(prev => [...prev, '🔌 手动断开连接'])
  }

  // 清空日志
  const clearMessages = () => {
    setMessages([])
  }

  // 获取阶段标签
  const getStageLabel = (stage: string): string => {
    const labels: {[key: string]: string} = {
      'belief': '信念系统',
      'drive': '内驱力', 
      'collective': '集体潜意识',
      'behavior': '外我行为',
      'mind': '头脑解释',
      'reaction': '外我反应'
    }
    return labels[stage] || stage
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">真正的SSE测试页面 (EventSource)</h1>
        
        {/* 连接状态 */}
        <div className="mb-6 bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-lg font-semibold">连接状态: </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' ? 'bg-green-600' :
                connectionStatus === 'connecting' ? 'bg-yellow-600' :
                connectionStatus === 'error' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                {connectionStatus === 'connected' ? '已连接' :
                 connectionStatus === 'connecting' ? '连接中' :
                 connectionStatus === 'error' ? '连接错误' : '未连接'}
              </span>
            </div>
            {sessionId && (
              <div className="text-sm text-gray-400">
                会话ID: {sessionId}
              </div>
            )}
          </div>

          {/* 进度显示 */}
          {isConnected && progress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span>当前阶段: {currentStage}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={connectSSE}
            disabled={isConnected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium"
          >
            {isConnected ? '已连接' : '建立SSE连接'}
          </button>
          
          <button
            onClick={triggerConsciousness}
            disabled={!isConnected}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium"
          >
            触发意识转化
          </button>
          
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium"
          >
            断开连接
          </button>
          
          <button
            onClick={clearMessages}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium"
          >
            清空日志
          </button>
        </div>

        {/* 消息日志 */}
        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">实时消息日志</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="text-sm font-mono bg-black/20 p-3 rounded whitespace-pre-wrap">
                {message}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                暂无消息，请建立SSE连接并触发意识转化
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
