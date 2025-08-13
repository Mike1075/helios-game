import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 在本地开发环境，转发到FastAPI后端
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000/api/chat'
      : `${process.env.VERCEL_URL}/api/chat`
    
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