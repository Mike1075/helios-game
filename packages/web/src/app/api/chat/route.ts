import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // n8n webhook URL
    const n8nWebhookUrl = 'https://n8n.aifunbox.com/webhook/1e211602-43af-4fdc-95df-27820c65d147'
    
    console.log('代理请求到n8n:', body)
    console.log('用户ID格式检查:', {
      user_id: body.user_id,
      is_uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id),
      expected_format: '6a477327-52ae-4853-afda-4e53d5760ad0'
    })
    
    // 转发请求到n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('n8n响应状态:', response.status)
    
    if (response.ok) {
      const responseText = await response.text()
      console.log('n8n原始响应:', responseText)
      
      let data
      try {
        // 尝试解析为JSON
        data = JSON.parse(responseText)
      } catch (error) {
        // 如果不是JSON，将文本作为响应内容
        console.log('n8n返回非JSON响应，使用文本内容')
        
        // 如果响应完全为空，可能是n8n工作流配置问题
        if (!responseText || responseText.trim() === '') {
          console.warn('n8n返回空响应，可能需要检查：')
          console.warn('1. n8n工作流是否正确配置了响应节点')
          console.warn('2. 数据库连接是否正常')
          console.warn('3. 是否缺少环境变量或凭证')
          
          data = { 
            response: '角色正在思考中...（n8n工作流返回空响应，请检查配置）',
            raw_response: responseText,
            debug_info: '空响应可能表示工作流配置不完整'
          }
        } else {
          data = { 
            response: responseText,
            raw_response: responseText
          }
        }
      }
      
      console.log('处理后的n8n数据:', data)
      
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    } else {
      const errorText = await response.text()
      console.error('n8n错误响应:', errorText)
      
      return NextResponse.json(
        { error: 'n8n请求失败', details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }
  } catch (error) {
    console.error('代理服务器错误:', error)

    // 安全地提取错误信息
    let errorMessage = '代理服务器异常'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    return NextResponse.json(
      { error: '代理服务器错误', details: errorMessage },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}