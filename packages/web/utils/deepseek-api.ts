interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function callDeepSeekAPI(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = 'sk-7eb408034c3d455f917a7f47f05e2b5f'
  
  const payload = {
    model: "deepseek-chat",
    messages: messages,
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  }

  try {
    console.log('正在调用DeepSeek API...')
    console.log('API密钥:', apiKey.substring(0, 10) + '...')
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('API响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API错误详情:', errorText)
      
      if (response.status === 402) {
        throw new Error('API密钥无效或账户余额不足，请检查DeepSeek账户状态')
      } else if (response.status === 401) {
        throw new Error('API密钥认证失败，请检查密钥是否正确')
      } else {
        throw new Error(`DeepSeek API错误 (${response.status}): ${errorText}`)
      }
    }

    const data: DeepSeekResponse = await response.json()
    console.log('API调用成功')
    return data.choices[0].message.content
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}
