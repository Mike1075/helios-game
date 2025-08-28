import { NextRequest, NextResponse } from 'next/server'
import { sseManager } from '@/lib/sse-manager'

// 阶段映射配置
const STAGE_CONFIG = {
  'belief': {
    name: 'belief',
    label: '信念系统',
    expectedFields: ['formatted_beliefs']
  },
  'drive': {
    name: 'drive', 
    label: '内驱力',
    expectedFields: ['formatted_inner_drives']
  },
  'collective': {
    name: 'collective',
    label: '集体潜意识', 
    expectedFields: ['formatted_collective_unconscious']
  },
  'behavior': {
    name: 'behavior',
    label: '外我行为',
    expectedFields: ['formatted_outerself1']
  },
  'mind': {
    name: 'mind',
    label: '头脑解释',
    expectedFields: ['formatted_brain']
  },
  'reaction': {
    name: 'reaction',
    label: '外我反应',
    expectedFields: ['formatted_outerself2']
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { stage: string } }
) {
  try {
    const stage = params.stage
    const body = await request.json()
    
    console.log(`收到n8n webhook回调: stage=${stage}`, body)

    // 验证阶段名称
    const stageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]
    if (!stageConfig) {
      console.error(`未知的阶段名称: ${stage}`)
      return NextResponse.json(
        { error: `Unknown stage: ${stage}` },
        { status: 400 }
      )
    }

    // 提取会话ID
    const sessionId = body.session_id || body.sessionId
    if (!sessionId) {
      console.error(`缺少session_id: stage=${stage}`)
      return NextResponse.json(
        { error: 'Missing session_id in webhook payload' },
        { status: 400 }
      )
    }

    // 检查会话是否存在
    const session = sseManager.getSession(sessionId)
    if (!session) {
      console.error(`会话不存在: sessionId=${sessionId}, stage=${stage}`)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // 提取阶段内容
    let content = ''
    for (const field of stageConfig.expectedFields) {
      if (body[field]) {
        content = body[field]
        break
      }
    }

    // 如果没有找到预期字段，尝试其他常见字段
    if (!content) {
      content = body.output || body.result || body.response || body.content || ''
    }

    // 如果仍然没有内容，使用默认消息
    if (!content) {
      content = `${stageConfig.label}：处理完成`
      console.warn(`阶段 ${stage} 没有返回内容，使用默认消息`)
    }

    console.log(`阶段 ${stage} 处理完成:`, {
      sessionId,
      contentLength: content.length,
      contentPreview: content.substring(0, 100)
    })

    // 更新阶段状态为完成
    sseManager.updateStageStatus(sessionId, stageConfig.name, 'completed', content)

    return NextResponse.json({
      success: true,
      stage: stageConfig.name,
      sessionId,
      message: `Stage ${stageConfig.label} processed successfully`
    })

  } catch (error) {
    console.error(`Webhook处理失败: stage=${params.stage}`, error)

    // 安全地提取错误信息
    let errorMessage = 'Webhook处理异常'
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

// 处理OPTIONS请求（CORS预检）
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

// 处理GET请求（用于测试）
export async function GET(
  request: NextRequest,
  { params }: { params: { stage: string } }
) {
  const stage = params.stage
  const stageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]
  
  if (!stageConfig) {
    return NextResponse.json(
      { error: `Unknown stage: ${stage}` },
      { status: 400 }
    )
  }

  return NextResponse.json({
    stage: stageConfig.name,
    label: stageConfig.label,
    expectedFields: stageConfig.expectedFields,
    endpoint: `/api/webhook/${stage}`,
    method: 'POST',
    description: `Webhook endpoint for ${stageConfig.label} stage`,
    examplePayload: {
      session_id: 'session_1234567890_abcdef123',
      [stageConfig.expectedFields[0]]: `示例${stageConfig.label}内容`,
      timestamp: new Date().toISOString()
    }
  })
}
