import { NextRequest, NextResponse } from 'next/server'
import { sseManager } from '@/lib/sse-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  try {
    if (sessionId) {
      // 获取特定会话的状态
      const session = sseManager.getSession(sessionId)
      const connection = sseManager.getConnection(sessionId)

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        sessionId,
        session: {
          userId: session.userId,
          message: session.message,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
          stages: session.stages
        },
        connection: connection ? {
          userId: connection.userId,
          createdAt: connection.createdAt,
          lastActivity: connection.lastActivity,
          isActive: true
        } : {
          isActive: false
        }
      })
    } else {
      // 获取全局统计信息
      const stats = sseManager.getStats()
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        stats,
        endpoints: {
          sseStream: '/api/sse-stream?userId={userId}&sessionId={sessionId}',
          triggerConsciousness: '/api/trigger-consciousness',
          webhooks: {
            belief: '/api/webhook/belief',
            drive: '/api/webhook/drive', 
            collective: '/api/webhook/collective',
            behavior: '/api/webhook/behavior',
            mind: '/api/webhook/mind',
            reaction: '/api/webhook/reaction'
          }
        }
      })
    }
  } catch (error) {
    console.error('获取SSE状态失败:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
