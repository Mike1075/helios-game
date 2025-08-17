import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// By using the default 'openai' export, we rely on Vercel's platform
// to automatically provide the correct OPENAI_API_KEY and OPENAI_BASE_URL
// from the AI Gateway integration settings. This is the most robust and
// standard approach.

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
