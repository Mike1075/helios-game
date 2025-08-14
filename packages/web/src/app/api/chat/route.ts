import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-4o-mini' } = await req.json();

    console.log(`Using model: ${model}`);
    
    // AI SDK 5 支持直接使用模型ID字符串，默认使用 Vercel AI Gateway
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