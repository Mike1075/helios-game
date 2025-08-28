'use client'

import { useState } from 'react'

export default function TestSSE() {
  const [messages, setMessages] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentStage, setCurrentStage] = useState('')
  const [progress, setProgress] = useState(0)

  const testSSE = async () => {
    setMessages([])
    setIsConnected(true)
    setCurrentStage('')
    setProgress(0)

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '我想变得更自信',
          user_id: '6a477327-52ae-4853-afda-4e53d5760ad0',
          timestamp: new Date().toISOString()
        })
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              console.log('SSE数据:', data)
              
              setCurrentStage(data.stage)
              setProgress(data.progress || 0)
              
              setMessages(prev => [...prev, `[${data.stage}] ${data.status}: ${data.content}`])
              
              if (data.stage === 'complete') {
                setIsConnected(false)
              }
            } catch (e) {
              console.error('解析SSE数据失败:', e, 'Line:', line)
              setMessages(prev => [...prev, `解析错误: ${line}`])
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE连接错误:', error)
      setMessages(prev => [...prev, `连接错误: ${error.message}`])
      setIsConnected(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SSE 测试页面</h1>
        
        <div className="mb-6">
          <button
            onClick={testSSE}
            disabled={isConnected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium"
          >
            {isConnected ? '连接中...' : '测试 SSE 连接'}
          </button>
        </div>

        {isConnected && (
          <div className="mb-6 bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span>当前阶段: {currentStage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">消息日志</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="text-sm font-mono bg-black/20 p-2 rounded">
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
