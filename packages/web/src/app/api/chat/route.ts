import { streamText } from 'ai'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-5-mini' } = await req.json()
  const result = streamText({ model, messages })
  return result.toTextStreamResponse()
}


