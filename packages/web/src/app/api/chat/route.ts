import { StreamingTextResponse, OpenAIStream } from 'ai';
import OpenAI from 'openai';

// IMPORTANT: Set the runtime to edge for better performance
export const runtime = 'edge';

// Create OpenAI client - will automatically use Vercel AI Gateway in Vercel environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-ai-gateway'
});

export async function POST(req: Request) {
  try {
    // 解析请求体
    const { messages, model = 'gpt-4o-mini' } = await req.json();

    console.log('Next.js API Route - Messages count:', messages?.length || 0);
    console.log('Next.js API Route - Model:', model);

    // 使用AI SDK 3 + OpenAI直接连接到Vercel AI Gateway
    // 在Vercel部署环境中，请求会自动路由到AI Gateway
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 2048,
      temperature: 0.7,
      stream: true,
    });

    console.log('Next.js API Route - OpenAI stream created successfully');

    // 使用AI SDK 3的标准流式响应格式
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('Next.js API Route Error:', error);
    
    // 返回结构化错误响应
    return new Response(
      JSON.stringify({ 
        error: 'AI服务调用失败', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}