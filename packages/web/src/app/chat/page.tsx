'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import Link from 'next/link'

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [],
    body: {
      model: selectedModel,
    }
  })

  return (
    <div className="min-h-screen helios-gradient">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link 
              href="/"
              className="mr-4 text-gray-400 hover:text-white transition-colors"
              title="返回主页"
            >
              ← 返回
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Helios Chat
            </h1>
          </div>
          <p className="text-gray-300">与AI对话，体验意识的交流</p>
        </div>

        {/* Model Selector */}
        <div className="helios-card p-4 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            选择模型:
          </label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="helios-input w-full max-w-xs"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (推荐)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          </select>
        </div>

        {/* Chat Messages */}
        <div className="helios-card mb-6 h-96 overflow-y-auto">
          <div className="p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p>开始与AI对话吧！</p>
                <p className="text-sm mt-2">当前模型: {selectedModel}</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`message-content ${
                    message.role === 'user' ? 'message-user' : 'message-assistant'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs opacity-75">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </span>
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="message-content message-assistant">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-75">🤖</span>
                    <div className="flex gap-1">
                      <div className="typing-indicator"></div>
                      <div className="typing-indicator" style={{animationDelay: '0.2s'}}></div>
                      <div className="typing-indicator" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm text-gray-400">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="helios-card p-4">
          <div className="flex gap-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="输入你的消息..."
              className="helios-input flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="helios-button px-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  发送中
                </div>
              ) : (
                '发送'
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            支持流式输出 • 当前模型: {selectedModel}
          </div>
        </form>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 helios-card p-4">
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-300">调试信息</summary>
              <div className="mt-2 space-y-1">
                <div>消息数量: {messages.length}</div>
                <div>加载状态: {isLoading ? '是' : '否'}</div>
                <div>输入内容: {input}</div>
                <div>选择模型: {selectedModel}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}