// supabase/functions/belief-observer/index.ts
// Helios v4.1 "本我之镜" - 基于角色行为的信念系统观察者
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { 
  character_id?: string;
  trigger_type?: string;
  record_count?: number;
};

Deno.serve(async (req) => {
  const { character_id, trigger_type, record_count } = (await req.json()) as Body;
  if (!character_id) {
    return new Response(JSON.stringify({ ok: false, msg: 'character_id required' }), { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    // 1) 获取角色基础信息
    const { data: character } = await sb
      .from('characters')
      .select('*')
      .eq('id', character_id)
      .single();

    if (!character) {
      return new Response(JSON.stringify({ ok: false, msg: 'character not found' }), { status: 404 });
    }

    // 2) 获取该角色的所有行为记录
    const { data: logs } = await sb
      .from('agent_logs')
      .select('action_type,speaker,text,input_context,output_context,ts')
      .eq('character_id', character_id)
      .order('ts', { ascending: true }); // 时间正序，观察演化过程

    if (!logs || logs.length < 5) {
      console.info(`[belief-observer] character ${character.name} has insufficient logs (${logs?.length || 0})`);
      return new Response(JSON.stringify({ ok: true, msg: 'insufficient_data' }));
    }

    // 3) 构建分析提示，遵循"本我之镜"哲学
    const prompt = `你是一个深刻的心理洞察者，正在观察角色"${character.name}"（${character.role}）的行为模式。

角色核心动机：${character.core_motivation}
角色标签：${character.tags?.join(', ') || '无'}

基于以下${logs.length}条行为记录，请深度分析并生成这个角色的内在信念系统：

${logs.map((log, i) => `${i + 1}. [${log.ts}] ${log.action_type}: ${log.text}`).join('\n')}

请生成一个YAML格式的信念系统，包含：
- worldview: 对世界本质的看法（150字内）
- selfview: 对自我身份的认知（150字内）  
- values: 核心价值观和行为驱动原则（150字内）
- behavioral_patterns: 观察到的行为模式（100字内）
- evolution_notes: 信念演化的关键节点（100字内）

要求：
1. 完全基于实际行为，不要添加未观察到的特征
2. 体现角色的真实个性，包括矛盾和复杂性
3. 使用第一人称视角描述（"我认为..."）
4. 保持与核心动机的一致性

YAML格式输出：`;

    // 4) 调用AI分析（这里先用占位符，后续可接入真实AI）
    // TODO: 接入 Vercel AI Gateway
    const beliefYaml = `# ${character.name} 的信念系统 (第${record_count || 'unknown'}次观察)
worldview: "我认为世界是一个复杂的社会网络，每个人都在追求自己的目标。通过观察他人的行为和动机，我可以更好地理解这个世界的运作规律。"
selfview: "我是一个${character.role}，我的存在有其独特的价值。我的行为反映了我内心深处的信念和价值观。"
values: "我重视${character.core_motivation}。通过我的行动，我在这个世界中寻找属于自己的位置和意义。"
behavioral_patterns: "从最近的行为中观察到，我倾向于根据自己的价值观做决定，同时会考虑他人的感受和社会环境。"
evolution_notes: "随着经历的积累，我的信念系统在不断演化和深化。"
generated_at: "${new Date().toISOString()}"
total_observations: ${logs.length}`;

    // 5) 更新信念系统并记录生成次数
    const { error: updateError } = await sb
      .from('belief_systems')
      .upsert({
        character_id,
        belief_yaml: beliefYaml,
        belief_summary: {
          last_analysis_date: new Date().toISOString(),
          total_logs_analyzed: logs.length,
          trigger_type: trigger_type || 'manual'
        },
        last_updated: new Date().toISOString(),
        generation_count: record_count || logs.length
      });

    if (updateError) {
      console.error('[belief-observer] failed to update belief system:', updateError);
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), { status: 500 });
    }

    console.info(`[belief-observer] updated belief system for ${character.name} (${logs.length} logs analyzed)`);

    return new Response(JSON.stringify({
      ok: true,
      character_name: character.name,
      logs_analyzed: logs.length,
      trigger_type: trigger_type || 'manual'
    }));

  } catch (error) {
    console.error('[belief-observer] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});