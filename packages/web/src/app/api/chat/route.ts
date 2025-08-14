import { streamText } from 'ai'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-5-mini' } = await req.json()
    
    // AI SDK 5需要AI_GATEWAY_API_KEY环境变量
    // Vercel中设置VERCEL_AI_GATEWAY_API_KEY，这里做兼容
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY
    
    if (!apiKey) {
      return Response.json(
        { error: 'AI Gateway API key not configured. Please set AI_GATEWAY_API_KEY or VERCEL_AI_GATEWAY_API_KEY in environment variables.' },
        { status: 500 }
      )
    }
    
    // 确保AI SDK能找到API key
    process.env.AI_GATEWAY_API_KEY = apiKey
    
    const result = streamText({ model, messages })
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}


