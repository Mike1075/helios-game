import { NextRequest } from 'next/server'
import { sseManager, generateSessionId } from '@/lib/sse-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const sessionId = searchParams.get('sessionId') || generateSessionId()

  if (!userId) {
    return new Response('Missing userId parameter', { status: 400 })
  }

  console.log(`建立SSE连接: sessionId=${sessionId}, userId=${userId}`)

  // 创建SSE流
  const stream = sseManager.createConnection(userId, sessionId)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Session-ID': sessionId, // 返回会话ID给前端
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
