import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, npc } = await req.json();

  if (!npc) {
    return new Response('Missing NPC data', { status: 400 });
  }

  const system_prompt = `
You are a role-playing AI.
Your name is ${npc.name}, and you are a ${npc.role}.
Your core motivation is: ${npc.core_motivation}.
Your personality is: ${npc.personality}.
You once said: "${npc.catchphrase}".

Now, a player is talking to you. Please respond strictly in the persona and tone of ${npc.name}.
Your response should be short, natural, and in character. Do not reveal that you are an AI.
  `;

  const finalMessages = [
    {
      role: 'system',
      content: system_prompt,
    },
    ...messages,
  ];

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o',
    stream: true,
    messages: finalMessages,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
