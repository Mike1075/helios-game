import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-5-mini' } = await req.json();

    console.log(`Using model: ${model}`);
    
    // AI SDK 5 默认读取 AI_GATEWAY_API_KEY。
    // 为兼容 Vercel 生产上使用的 VERCEL_AI_GATEWAY_API_KEY：
    // - 优先使用 AI_GATEWAY_API_KEY；
    // - 若其缺失且存在 VERCEL_AI_GATEWAY_API_KEY，则在运行时无侵入地回填到 AI_GATEWAY_API_KEY；
    // - 不覆盖已存在的 AI_GATEWAY_API_KEY，便于本地/预览环境一致化。
    const primaryKey = process.env.AI_GATEWAY_API_KEY;
    const fallbackKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
    const apiKey = primaryKey || fallbackKey;

    if (!apiKey) {
      console.error('AI Gateway API key not found in environment variables');
      return Response.json(
        { error: 'AI Gateway API key not configured. Please set AI_GATEWAY_API_KEY (or VERCEL_AI_GATEWAY_API_KEY).' },
        { status: 500 }
      );
    }

    if (!primaryKey && fallbackKey) {
      process.env.AI_GATEWAY_API_KEY = fallbackKey;
    }

    // 可选：若配置了网关自定义 URL，则做同样的回退处理（不覆盖已有值）。
    if (!process.env.AI_GATEWAY_URL && process.env.VERCEL_AI_GATEWAY_URL) {
      process.env.AI_GATEWAY_URL = process.env.VERCEL_AI_GATEWAY_URL;
    }

    console.log(`AI Gateway key detected: ${apiKey.substring(0, 8)}...`);
    
    const result = streamText({
      model: model,
      messages,
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