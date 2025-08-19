import { NextApiRequest, NextApiResponse } from 'next'
import { callDeepSeekAPI } from '../../utils/deepseek-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('检查DeepSeek API状态...')
    
    const testMessages = [
      { role: 'system' as const, content: '你是一个测试助手，请简单回复"API连接正常"' },
      { role: 'user' as const, content: '测试连接' }
    ]
    
    const response = await callDeepSeekAPI(testMessages)
    
    res.status(200).json({
      status: 'success',
      message: 'DeepSeek API连接正常',
      response: response
    })
  } catch (error) {
    console.error('API检查失败:', error)
    
    res.status(500).json({
      status: 'error',
      message: 'DeepSeek API连接失败',
      error: error instanceof Error ? error.message : '未知错误',
      suggestion: '请检查API密钥和账户状态'
    })
  }
}
