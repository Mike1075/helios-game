import { streamText } from 'ai'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-5-mini', userId, sessionId } = await req.json()
    
    if (!userId) {
      return Response.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }
    
    // AI SDK 5需要AI_GATEWAY_API_KEY环境变量
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY
    
    if (!apiKey) {
      return Response.json(
        { error: 'AI Gateway API key not configured' },
        { status: 500 }
      )
    }
    
    // 确保AI SDK能找到API key
    process.env.AI_GATEWAY_API_KEY = apiKey
    
    // 保存用户消息到Supabase
    const userMessage = messages[messages.length - 1]
    if (userMessage && userMessage.role === 'user') {
      await supabase.from('chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'user',
        content: userMessage.content,
        model: model,
        created_at: new Date().toISOString()
      })
    }
    
    // 生成AI响应
    const result = streamText({ model, messages })
    
    // 获取完整响应内容并保存到Supabase和Zep
    const streamResponse = result.toTextStreamResponse()
    
    // 创建新的响应流来捕获内容
    const reader = streamResponse.body?.getReader()
    if (!reader) {
      return streamResponse
    }
    
    let fullContent = ''
    const decoder = new TextDecoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // 保存完整的AI响应
              if (fullContent) {
                await Promise.all([
                  // 保存到Supabase
                  supabase.from('chat_messages').insert({
                    user_id: userId,
                    session_id: sessionId,
                    role: 'assistant',
                    content: fullContent,
                    model: model,
                    created_at: new Date().toISOString()
                  }),
                  // 保存到Zep (如果配置了)
                  saveToZep(userId, sessionId, userMessage?.content, fullContent, model)
                ])
              }
              controller.close()
              break
            }
            
            const chunk = decoder.decode(value)
            fullContent += chunk
            controller.enqueue(value)
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })
    
    return new Response(stream, {
      headers: streamResponse.headers
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

async function saveToZep(userId: string, sessionId: string, userMessage: string, assistantMessage: string, model: string) {
  const zepApiKey = process.env.ZEP_API_KEY
  const zepApiUrl = process.env.ZEP_API_URL || 'https://api.getzep.com'
  
  if (!zepApiKey) {
    console.warn('ZEP_API_KEY not configured, skipping Zep save')
    return
  }
  
  try {
    // 使用userId作为Zep的session_id以确保一致性
    const zepSessionId = `${userId}_${sessionId}`
    
    const zepMessages = []
    if (userMessage) {
      zepMessages.push({
        role: 'user',
        content: userMessage,
        metadata: { model, timestamp: new Date().toISOString() }
      })
    }
    
    if (assistantMessage) {
      zepMessages.push({
        role: 'assistant', 
        content: assistantMessage,
        metadata: { model, timestamp: new Date().toISOString() }
      })
    }
    
    await fetch(`${zepApiUrl}/v2/sessions/${zepSessionId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zepApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: zepMessages })
    })
    
  } catch (error) {
    console.error('Zep save error:', error)
    // 不抛出错误，Zep保存失败不应影响聊天功能
  }
}


