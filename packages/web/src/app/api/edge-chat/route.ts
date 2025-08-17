import { streamText } from 'ai'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-5-mini' } = await req.json()

    const primaryKey = process.env.AI_GATEWAY_API_KEY
    const fallbackKey = process.env.VERCEL_AI_GATEWAY_API_KEY
    const apiKey = primaryKey || fallbackKey
    if (!apiKey) {
      return Response.json({ error: 'AI Gateway API key not configured' }, { status: 500 })
    }
    if (!primaryKey && fallbackKey) process.env.AI_GATEWAY_API_KEY = fallbackKey
    if (!process.env.AI_GATEWAY_URL && process.env.VERCEL_AI_GATEWAY_URL) {
      process.env.AI_GATEWAY_URL = process.env.VERCEL_AI_GATEWAY_URL
    }

    const result = streamText({ model, messages })
    return result.toTextStreamResponse()
  } catch (error) {
    return Response.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}


