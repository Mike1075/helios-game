'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', color: '#10a37f' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10a37f' },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', color: '#10a37f' },
  { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#ff6b35' },
  { id: 'anthropic/claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', color: '#ff6b35' },
  { id: 'google/gemini-1.5-pro-002', name: 'Gemini 1.5 Pro', provider: 'Google', color: '#4285f4' },
  { id: 'google/gemini-1.5-flash-002', name: 'Gemini 1.5 Flash', provider: 'Google', color: '#4285f4' },
  { id: 'meta-llama/llama-3.2-90b-instruct', name: 'Llama 3.2 90B', provider: 'Meta', color: '#0866ff' },
  { id: 'mistral/mistral-large-2407', name: 'Mistral Large', provider: 'Mistral', color: '#ff7000' },
  { id: 'cohere/command-r-plus-08-2024', name: 'Command R+', provider: 'Cohere', color: '#39594c' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // 添加空的AI消息用于流式更新
    const aiMessageIndex = newMessages.length
    setMessages([...newMessages, { role: 'assistant', content: '' } as Message])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          model: selectedModel
        })
      })

      if (!response.ok) {
        throw new Error('Response not ok')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get reader')
      const decoder = new TextDecoder()
      let aiContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        aiContent += chunk

        // 实时更新AI消息
        setMessages(prev => {
          const updated = [...prev]
          updated[aiMessageIndex] = { role: 'assistant', content: aiContent }
          return updated
        })
      }

    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => {
        const updated = [...prev]
        updated[aiMessageIndex] = { role: 'assistant', content: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error') }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 style={{
            margin: 0,
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            🤖 AI Chat
          </h1>
          
          {/* Model Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: `2px solid ${selectedModelInfo?.color || '#ddd'}`,
              fontSize: '0.9rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: selectedModelInfo?.color || '#ddd'
              }}></div>
              <span style={{ fontWeight: '500', color: '#333' }}>
                {selectedModelInfo?.name} 
              </span>
              <span style={{ color: '#666', fontSize: '0.8rem' }}>
                ({selectedModelInfo?.provider})
              </span>
            </div>
            
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: 'white',
                fontSize: '0.9rem',
                minWidth: '200px',
                cursor: 'pointer'
              }}
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '70vh'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '4rem' }}>💬</div>
                <h3 style={{ margin: 0, color: '#333' }}>开始对话</h3>
                <p style={{ margin: 0 }}>
                  当前使用: <strong>{selectedModelInfo?.name}</strong> ({selectedModelInfo?.provider})
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '1rem 1.5rem',
                  borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: message.role === 'user' 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)'
                    : '#f8f9fa',
                  color: message.role === 'user' ? 'white' : '#333',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: message.content ? '0.5rem' : 0,
                    fontSize: '0.8rem',
                    opacity: 0.8
                  }}>
                    <span>{message.role === 'user' ? '👤' : '🤖'}</span>
                    <span>
                      {message.role === 'user' ? 'You' : selectedModelInfo?.name}
                    </span>
                  </div>
                  
                  {message.role === 'assistant' ? (
                    <div style={{ margin: 0 }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({inline, className, children, ...props}: any) => (
                          <code
                            style={{
                              background: inline ? '#e9ecef' : '#f8f9fa',
                              padding: inline ? '2px 4px' : '8px',
                              borderRadius: '4px',
                              fontSize: '0.9em',
                              fontFamily: 'Monaco, Consolas, monospace',
                              display: inline ? 'inline' : 'block',
                              whiteSpace: 'pre-wrap'
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre style={{ 
                            background: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            overflow: 'auto',
                            margin: '0.5rem 0'
                          }}>
                            {children}
                          </pre>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '20px 20px 20px 4px',
                  background: '#f8f9fa',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out 0.3s infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out 0.6s infinite'
                  }}></div>
                  <span style={{ marginLeft: '0.5rem' }}>正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.5)'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`与 ${selectedModelInfo?.name} 对话...`}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  borderRadius: '25px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  color: '#333',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: isLoading || !input.trim() 
                    ? '#ccc' 
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onMouseOver={(e) => {
                  if (!isLoading && input.trim()) {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none'
                }}
              >
                {isLoading ? '发送中...' : '发送 📤'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}