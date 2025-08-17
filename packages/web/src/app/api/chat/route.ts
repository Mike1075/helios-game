import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// This is the definitive, final configuration based on the working curl command.
// It uses the specific API key name from the internal spec and the explicit
// AI Gateway URL, removing all ambiguities from previous attempts.
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1', // The explicit Vercel AI Gateway endpoint
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
