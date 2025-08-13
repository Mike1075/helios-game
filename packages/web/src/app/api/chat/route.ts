import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// IMPORTANT: Set the runtime to edge for better performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 解析请求体
    const { messages, model = 'gpt-4o-mini' } = await req.json();

    console.log('Next.js API Route - Messages count:', messages?.length || 0);
    console.log('Next.js API Route - Model:', model);

    // 使用AI SDK 5直接连接到Vercel AI Gateway
    // 在Vercel部署环境中，AI SDK会自动使用AI Gateway
    const result = await streamText({
      model: openai(model),
      messages,
      maxTokens: 2048,
      temperature: 0.7,
    });

    console.log('Next.js API Route - AI SDK streamText created successfully');

    // 返回标准AI SDK流式响应，完全兼容useChat
    return result.toDataStreamResponse();
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