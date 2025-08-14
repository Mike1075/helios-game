import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-5-mini' } = await req.json();

    // 兼容本地和Vercel环境变量
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY;
    
    // 验证API key是否存在
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return Response.json(
        { error: 'AI Gateway API key not configured. Please set VERCEL_AI_GATEWAY_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    console.log(`Using model: ${model}`);
    console.log(`API key configured: ${apiKey ? 'Yes' : 'No'}`);
    
    const result = streamText({
      model: model,
      messages,
      apiKey: apiKey,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}