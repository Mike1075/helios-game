import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 初始化 DeepSeek 客户端（使用 OpenAI SDK，兼容 DeepSeek API）
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-144b6696dc094d8faf7804076159f126', // 请将此处替换为您的完整API Key
  baseURL: 'https://api.deepseek.com/v1',
});

export async function POST(request: NextRequest) {
  try {
    // 调试信息
    console.log('所有环境变量:', Object.keys(process.env).filter(key => key.includes('API')));
    console.log('DEEPSEEK_API_KEY 存在:', !!process.env.DEEPSEEK_API_KEY);
    console.log('OPENAI_API_KEY 存在:', !!process.env.OPENAI_API_KEY);
    console.log('DeepSeek API Key 前缀:', process.env.DEEPSEEK_API_KEY?.slice(0, 10));
    
    // 解析请求体
    const body = await request.json();
    const { messages } = body;
    
    console.log('收到消息:', messages);

    // 校验 messages 参数
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages 参数必须是一个数组' },
        { status: 400 }
      );
    }

    // 校验每个消息的格式
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: '每条消息必须包含 role 和 content 字段' },
          { status: 400 }
        );
      }
    }

    // 检查 API Key（暂时跳过检查，使用硬编码）
    // if (!process.env.DEEPSEEK_API_KEY) {
    //   return NextResponse.json(
    //     { error: '服务器配置错误: 缺少 DEEPSEEK_API_KEY' },
    //     { status: 500 }
    //   );
    // }

    // 调用真实的 DeepSeek API
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',  // 使用 DeepSeek 模型
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // 提取回复内容
    const reply = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。';

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('DeepSeek API 错误:', error);
    
    // 处理 OpenAI 特定错误
    if (error?.status === 429) {
      return NextResponse.json(
        { error: `请求过于频繁，请等待 30 秒后重试。如果问题持续，可能是 API 配额不足，请检查 DeepSeek 账户余额。` },
        { status: 429 }
      );
    }
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: `API 认证失败: ${error.message || 'API Key 无效或过期'}` },
        { status: 401 }
      );
    }
    
    // 处理其他错误
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `API 调用失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 禁用其他 HTTP 方法
export async function GET() {
  return NextResponse.json(
    { error: '此端点仅支持 POST 请求' },
    { status: 405 }
  );
}
