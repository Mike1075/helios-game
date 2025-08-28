import { NextRequest, NextResponse } from 'next/server'
import { sseManager } from '@/lib/sse-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, message } = body

    if (!sessionId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId, message' },
        { status: 400 }
      )
    }

    console.log(`触发意识转化流程: sessionId=${sessionId}, userId=${userId}`)

    // 检查SSE连接是否存在
    const connection = sseManager.getConnection(sessionId)
    if (!connection) {
      return NextResponse.json(
        { error: 'SSE connection not found. Please establish connection first.' },
        { status: 404 }
      )
    }

    // 创建意识转化会话
    const session = sseManager.createConsciousnessSession(sessionId, userId, message)

    // 发送开始信号
    sseManager.sendToConnection(sessionId, {
      type: 'consciousness_start',
      status: 'started',
      message: '意识转化流程开始...',
      sessionId,
      timestamp: new Date().toISOString()
    })

    // 调用n8n工作流
    const n8nWebhookUrl = 'https://n8n.aifunbox.com/webhook/6ea71436-5400-43a5-b881-ca0ff2173a96'
    
    // 准备发送给n8n的数据，包含回调信息
    const n8nPayload = {
      message,
      user_id: userId,
      timestamp: new Date().toISOString(),
      // 添加回调信息，让n8n知道如何回调我们的webhook端点
      callback_base_url: getCallbackBaseUrl(request),
      session_id: sessionId
    }

    console.log('调用n8n工作流:', n8nPayload)

    // 异步调用n8n，不等待响应
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Helios-SSE-Trigger/1.0'
      },
      body: JSON.stringify(n8nPayload)
    }).then(async (response) => {
      if (response.ok) {
        console.log(`n8n工作流触发成功: ${sessionId}`)
        
        // 如果n8n立即返回了完整结果（兼容旧版本工作流）
        try {
          const responseText = await response.text()
          if (responseText && responseText.trim()) {
            console.log(`n8n返回了立即响应: ${sessionId}`, responseText)
            
            let data
            try {
              data = JSON.parse(responseText)
            } catch (parseError) {
              console.log('n8n返回非JSON响应，可能是新版本工作流')
              return
            }

            // 如果返回了完整的格式化结果，解析并发送
            if (data.formatted_beliefs || data.formatted_inner_drives) {
              console.log('检测到旧版本n8n工作流，解析完整响应')
              await handleLegacyN8nResponse(sessionId, data)
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '响应处理出错'
          console.log('n8n响应处理出错，可能是新版本工作流:', errorMessage)
        }
      } else {
        const errorText = await response.text()
        console.error(`n8n工作流触发失败: ${sessionId}`, response.status, errorText)
        
        // 发送错误信息
        sseManager.sendToConnection(sessionId, {
          type: 'error',
          status: 'error',
          message: `n8n工作流触发失败: ${response.status}`,
          error: errorText,
          timestamp: new Date().toISOString()
        })
      }
    }).catch((error) => {
      console.error(`n8n工作流调用异常: ${sessionId}`, error)

      // 安全地提取错误信息
      let errorMessage = 'n8n工作流调用异常'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      // 发送错误信息
      sseManager.sendToConnection(sessionId, {
        type: 'error',
        status: 'error',
        message: 'n8n工作流调用失败',
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Consciousness transformation triggered successfully'
    })

  } catch (error) {
    console.error('触发意识转化流程失败:', error)

    // 安全地提取错误信息
    let errorMessage = '内部服务器错误'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

// 处理旧版本n8n工作流的完整响应
async function handleLegacyN8nResponse(sessionId: string, data: any) {
  const stageMapping = [
    { name: 'belief', field: 'formatted_beliefs' },
    { name: 'drive', field: 'formatted_inner_drives' },
    { name: 'collective', field: 'formatted_collective_unconscious' },
    { name: 'behavior', field: 'formatted_outerself1' },
    { name: 'mind', field: 'formatted_brain' },
    { name: 'reaction', field: 'formatted_outerself2' }
  ]

  // 模拟阶段性处理，让用户看到进度
  for (let i = 0; i < stageMapping.length; i++) {
    const stage = stageMapping[i]
    
    // 发送处理中状态
    sseManager.updateStageStatus(sessionId, stage.name, 'processing')
    
    // 添加延迟，模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    
    // 发送完成状态
    const content = data[stage.field] || `${stage.name}：处理完成`
    sseManager.updateStageStatus(sessionId, stage.name, 'completed', content)
  }
}

// 获取回调基础URL
function getCallbackBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}/api/webhook`
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
