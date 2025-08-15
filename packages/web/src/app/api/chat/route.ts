// packages/web/src/app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const { session_id = 'demo', message } = await req.json();
  const supabase = sb();

  // 1) log user
  try {
    await supabase?.from('agent_logs').insert({ session_id, speaker: 'user', text: message, meta: {} });
  } catch (e) { console.info('[agent_logs][user] skip due to env or error'); }

  // 2) AI stream
  const result = await streamText({
    model: openai('gpt-4o'), // can be routed by AI Gateway
    prompt: message,
  });

  // 3) log ai on finish
  result.onFinish(async ({ text }) => {
    try {
      await supabase?.from('agent_logs').insert({ session_id, speaker: 'ai', text, meta: {} });
    } catch (e) { console.info('[agent_logs][ai] skip due to env or error'); }
  });

  return result.toAIStreamResponse();
}