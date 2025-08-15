// supabase/functions/belief-observer/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { session_id?: string };

Deno.serve(async (req) => {
  const { session_id } = (await req.json()) as Body;
  if (!session_id) return new Response(JSON.stringify({ ok:false, msg:'no session_id' }), { status:400 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb  = createClient(url, key);

  // 1) 最近行为
  const { data: logs } = await sb
    .from('agent_logs')
    .select('speaker,text,ts')
    .eq('session_id', session_id)
    .order('ts', { ascending: false })
    .limit(50);

  // 2) 调模型（建议走 AI Gateway；此处留出对接位）
  const prompt = `基于以下对话，生成/更新该"主体"的信念系统(YAML):\n${
    (logs||[]).map((r:any)=>`- [${r.ts}] ${r.speaker}: ${r.text}`).join('\n')
  }`;

  // TODO: fetch gateway here; for MVP, we写一个占位
  const beliefYaml = `worldview: tentative
selfview: observing
values: curiosity`;

  // 3) 写回（MVP：用 session_id 作为唯一键；正式版用 character_id）
  await sb.from('belief_systems').upsert({
    character_id: crypto.randomUUID(), // TODO: 按角色体系替换
    belief_yaml: beliefYaml,
    last_updated: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok:true }));
});