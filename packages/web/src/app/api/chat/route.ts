import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, npc } = await req.json();

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

  const { textStream } = await streamText({
    model: openai('openai/gpt-4o'),
    system: system_prompt,
    messages: messages,
  });

  return new Response(textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
