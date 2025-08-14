'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message { role: 'user' | 'assistant'; content: string }

const MODELS = [
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState(MODELS[0].id)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const user: Message = { role: 'user', content: input }
    const base = [...messages, user]
    setMessages(base)
    setInput('')
    setIsLoading(true)

    const idx = base.length
    setMessages([...base, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: base, model })
      })
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value)
        setMessages(prev => { const u = [...prev]; u[idx] = { role:'assistant', content: acc }; return u })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <select value={model} onChange={e=>setModel(e.target.value)}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div style={{ height: '70vh', overflowY: 'auto', padding: 12, background: '#fff', borderRadius: 8 }}>
        {messages.map((m,i)=> (
          <div key={i} style={{ textAlign: m.role==='user'?'right':'left', margin: '8px 0' }}>
            {m.role==='assistant'
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              : <div style={{ whiteSpace:'pre-wrap' }}>{m.content}</div>}
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', gap: 8, marginTop: 12 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} style={{ flex:1 }} placeholder="输入消息"/>
        <button disabled={isLoading || !input.trim()}>{isLoading?'发送中...':'发送'}</button>
      </form>
    </div>
  )
}


