import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
// No need to import 'dotenv/config' in Next.js.
// The framework automatically loads .env.local variables.

// Per internal spec, the API key is stored in AI_GATEWAY_API_KEY.
// The Vercel AI Gateway also injects a custom OPENAI_BASE_URL.
// We must create a custom OpenAI client instance to provide BOTH,
// ensuring requests are correctly authenticated AND routed.
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // The crucial missing piece
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, npc }: { messages: CoreMessage[]; npc: any } =
    await req.json();

  if (!npc) {
    return new Response('Missing NPC data', { status: 400 });
  }

  const system_prompt = `You are a role-playing AI.
Your name is ${npc.name}, and you are a ${npc.role}.
Your core motivation is: ${npc.core_motivation}.
Your personality is: ${npc.personality}.
You once said: "${npc.catchphrase}".

Now, a player is talking to you. Please respond strictly in the persona and tone of ${npc.name}.
Your response should be short, natural, and in character. Do not reveal that you are an AI.`;

  const result = await streamText({
    model: openai('openai/gpt-4o'),
    system: system_prompt,
    messages: messages,
  });

  return result.toAIStreamResponse();
}
