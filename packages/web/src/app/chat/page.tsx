'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import Link from 'next/link'

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [],
    body: {
      model: selectedModel,
      stream: true
    },
    headers: {
      'Content-Type': 'application/json',
    },
    onError: (error) => {
      console.error('Chat error:', error)
      console.error('Error details:', error.message)
    },
    onFinish: (message) => {
      console.log('Chat finished:', message)
    },
    onResponse: (response) => {
      console.log('Response received:', response.status, response.statusText)
      if (!response.ok) {
        console.error('Response not OK:', response)
      }
    }
  })

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #581c87, #1e3a8a, #312e81)',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Link 
              href="/"
              style={{
                marginRight: '20px',
                color: '#9ca3af',
                textDecoration: 'none',
                fontSize: '14px'
              }}
              title="返回主页"
            >
              ← 返回
            </Link>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #fbbf24, #ec4899, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Helios Chat
            </h1>
          </div>
          <p style={{ color: '#d1d5db', fontSize: '1.1rem' }}>与AI对话，体验意识的交流</p>
        </div>

        {/* Model Selector */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '10px', 
          padding: '20px', 
          marginBottom: '20px' 
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#d1d5db', 
            marginBottom: '10px' 
          }}>
            选择模型:
          </label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '10px 15px',
              color: 'white',
              fontSize: '14px',
              width: '300px',
              maxWidth: '100%'
            }}
          >
            <option value="gpt-4o-mini">GPT-4o Mini (推荐)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          </select>
        </div>

        {/* Chat Messages */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '10px', 
          height: '400px',
          overflowY: 'auto',
          marginBottom: '20px',
          padding: '20px'
        }}>
          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              color: '#fca5a5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>❌</span>
                <div>
                  <div style={{ fontWeight: '500' }}>连接错误</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{error.message}</div>
                </div>
              </div>
            </div>
          )}
          
          {messages.length === 0 && !error && (
            <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '100px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤖</div>
              <p>开始与AI对话吧！</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>当前模型: {selectedModel}</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px'
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: message.role === 'user' 
                    ? 'linear-gradient(90deg, #7c3aed, #2563eb)'
                    : 'rgba(255,255,255,0.1)',
                  border: message.role === 'assistant' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.75 }}>
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.75 }}>🤖</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '20px', 
                      background: '#8b5cf6', 
                      borderRadius: '2px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                    <div style={{ 
                      width: '8px', 
                      height: '20px', 
                      background: '#8b5cf6', 
                      borderRadius: '2px',
                      animation: 'pulse 1.5s ease-in-out 0.2s infinite'
                    }}></div>
                    <div style={{ 
                      width: '8px', 
                      height: '20px', 
                      background: '#8b5cf6', 
                      borderRadius: '2px',
                      animation: 'pulse 1.5s ease-in-out 0.4s infinite'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '10px', 
          padding: '20px' 
        }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="输入你的消息..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim() 
                  ? 'rgba(124, 58, 237, 0.5)' 
                  : 'linear-gradient(90deg, #7c3aed, #2563eb)',
                color: 'white',
                fontWeight: '500',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#9ca3af' 
          }}>
            支持流式输出 • 当前模型: {selectedModel}
          </div>
        </form>

        {/* Debug Info - Development only */}
        <div style={{ 
          marginTop: '20px',
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '10px', 
          padding: '15px' 
        }}>
          <details style={{ fontSize: '12px', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>调试信息</summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div>消息数量: {messages.length}</div>
              <div>加载状态: {isLoading ? '是' : '否'}</div>
              <div>输入内容: {input}</div>
              <div>选择模型: {selectedModel}</div>
              <div>API端点: /api/chat</div>
              <div>环境: {typeof window !== 'undefined' ? '浏览器' : '服务器'}</div>
              <div>错误状态: {error ? '有错误' : '正常'}</div>
              <div>最后错误: {error?.message?.slice(0, 30) || '无'}</div>
            </div>
          </details>
        </div>
      </div>

      {/* Add simple CSS animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}