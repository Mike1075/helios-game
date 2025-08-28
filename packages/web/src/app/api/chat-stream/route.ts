import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // 创建 SSE 响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接确认
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        stage: 'connected',
        status: 'started',
        content: '意识转化开始...'
      })}\n\n`))
      
      // 启动意识转化流程
      processConsciousnessFlow(controller, encoder, body)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

async function processConsciousnessFlow(controller: ReadableStreamDefaultController, encoder: TextEncoder, body: any) {
  // 基于您的n8n工作流配置的6个意识转化阶段
  const stages = [
    { 
      name: 'belief', 
      label: '信念系统', 
      description: '正在通过信念过滤器处理意图...',
      expectedField: 'formatted_beliefs'
    },
    { 
      name: 'drive', 
      label: '内驱力', 
      description: '正在注入行动能量...',
      expectedField: 'formatted_inner_drives'
    },
    { 
      name: 'collective', 
      label: '集体潜意识', 
      description: '正在检索客观世界约束...',
      expectedField: 'formatted_collective_unconscious'
    },
    { 
      name: 'behavior', 
      label: '外我行为', 
      description: '正在生成具体行动...',
      expectedField: 'formatted_outerself1'
    },
    { 
      name: 'mind', 
      label: '头脑解释', 
      description: '正在构建因果关系...',
      expectedField: 'formatted_brain'
    },
    { 
      name: 'reaction', 
      label: '外我反应', 
      description: '正在感受身心变化...',
      expectedField: 'formatted_outerself2'
    }
  ]

  const n8nWebhookUrl = 'https://n8n.aifunbox.com/webhook/1e211602-43af-4fdc-95df-27820c65d147'
  let accumulatedResults: {[key: string]: string} = {}

  try {
    console.log('开始SSE意识转化流程:', body)

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      
      // 发送阶段开始信号
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        stage: stage.name,
        status: 'processing',
        content: stage.description,
        progress: Math.round(((i) / stages.length) * 100)
      })}\n\n`))

      // 模拟阶段处理时间，让用户看到进度
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      try {
        // 只在第一个阶段调用n8n工作流，获取完整结果
        if (i === 0) {
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Helios-SSE-Client/1.0'
            },
            body: JSON.stringify({
              ...body,
              timestamp: new Date().toISOString()
            })
          })

          if (response.ok) {
            const responseText = await response.text()
            console.log('n8n完整响应:', responseText)

            let data
            try {
              data = JSON.parse(responseText)
            } catch (parseError) {
              console.error('JSON解析失败:', parseError)
              data = { error: 'JSON解析失败', raw: responseText }
            }

            // 解析所有阶段的结果
            const stageResults = {
              'belief': data.formatted_beliefs || '信念系统：处理完成',
              'drive': data.formatted_inner_drives || '内驱力：处理完成',
              'collective': data.formatted_collective_unconscious || '集体潜意识：处理完成',
              'behavior': data.formatted_outerself1 || '外我行为：处理完成',
              'mind': data.formatted_brain || '头脑解释：处理完成',
              'reaction': data.formatted_outerself2 || '外我反应：处理完成'
            }

            // 存储所有结果
            Object.assign(accumulatedResults, stageResults)

            console.log('解析的阶段结果:', stageResults)

          } else {
            const errorText = await response.text()
            console.error('n8n HTTP错误:', response.status, errorText)

            // 如果n8n调用失败，使用模拟数据
            const mockResults = {
              'belief': '信念系统：连接失败，使用模拟数据',
              'drive': '内驱力：连接失败，使用模拟数据',
              'collective': '集体潜意识：连接失败，使用模拟数据',
              'behavior': '外我行为：连接失败，使用模拟数据',
              'mind': '头脑解释：连接失败，使用模拟数据',
              'reaction': '外我反应：连接失败，使用模拟数据'
            }
            Object.assign(accumulatedResults, mockResults)
          }
        }

        // 发送当前阶段的结果
        const stageContent = accumulatedResults[stage.name] || `${stage.label}：处理完成`

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          stage: stage.name,
          status: 'completed',
          content: stageContent,
          progress: Math.round(((i + 1) / stages.length) * 100)
        })}\n\n`))

      } catch (stageError) {
        console.error(`阶段 ${stage.name} 执行错误:`, stageError)

        // 安全地提取错误信息
        let errorMessage = '网络连接异常'
        if (stageError instanceof Error) {
          errorMessage = stageError.message
        } else if (typeof stageError === 'string') {
          errorMessage = stageError
        } else if (stageError && typeof stageError === 'object' && 'message' in stageError) {
          errorMessage = String(stageError.message)
        }

        const errorContent = `${stage.label}：网络连接问题，跳过此阶段...`
        accumulatedResults[stage.name] = errorContent

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          stage: stage.name,
          status: 'error',
          content: errorContent,
          progress: Math.round(((i + 1) / stages.length) * 100),
          error: errorMessage
        })}\n\n`))
      }
    }

    // 发送最终完成信号，包含所有阶段的结果
    const finalContent = Object.entries(accumulatedResults)
      .map(([stageName, content]) => content)
      .join('\n\n')

    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      stage: 'complete',
      status: 'finished',
      content: finalContent,
      progress: 100,
      all_stages: accumulatedResults
    })}\n\n`))

    console.log('SSE意识转化流程完成')

  } catch (error) {
    console.error('SSE流程全局错误:', error)

    // 安全地提取错误信息
    let errorMessage = '未知错误'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }

    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      stage: 'error',
      status: 'failed',
      content: '意识转化过程出现严重错误，请稍后重试',
      error: errorMessage
    })}\n\n`))
  } finally {
    controller.close()
  }
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
