import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 在Vercel环境中，直接使用FastAPI端点
    // 根据vercel.json配置，/api/ 路径会路由到packages/api/main.py
    
    // 如果在生产环境，API请求应该直接路由到FastAPI
    // 在本地开发环境，需要代理到localhost:8000
    if (process.env.NODE_ENV === 'development') {
      // 本地开发：转发到FastAPI后端
      const apiUrl = 'http://localhost:8000/api/chat'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: body.messages,
          model: body.model || 'gpt-4o-mini',
          stream: body.stream !== false
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // 如果是流式响应，直接返回流
      if (response.headers.get('content-type')?.includes('text/plain')) {
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })
      }

      // 非流式响应
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // 生产环境：返回错误，因为应该直接使用FastAPI路由
      return NextResponse.json(
        { 
          error: 'This endpoint should not be used in production. Use /api/chat directly.',
          redirect: '/api/chat' 
        }, 
        { status: 501 }
      )
    }

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Helios Chat API is running',
    endpoints: ['/api/chat'],
    version: '0.1.0'
  })
}