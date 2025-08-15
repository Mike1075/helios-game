// supabase/functions/echo/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { 
  session_id?: string;
  character_id?: string;
  event_id?: string;
  message?: string;
};

interface BeliefSystem {
  worldview: string;
  selfview: string;
  values: string;
}

// 解析 YAML 格式的信念系统（简化版）
function parseBeliefYaml(beliefYaml: string): BeliefSystem {
  const lines = beliefYaml.split('\n');
  const beliefs: any = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.includes(':')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      beliefs[key] = value;
    }
  });
  
  return {
    worldview: beliefs.worldview || '未知',
    selfview: beliefs.selfview || '观察中',
    values: beliefs.values || '好奇心'
  };
}

// 生成主观归因文本
function generateSubjectiveAttribution(
  beliefs: BeliefSystem, 
  recentLogs: any[], 
  triggerEvent?: any
): string {
  const templates = [
    `从我的${beliefs.worldview}世界观来看，刚才发生的事情让我意识到${beliefs.values}价值观在起作用。`,
    `以我${beliefs.selfview}的自我认知，我觉得这种情况反映了我内在的${beliefs.values}。`,
    `基于我对世界${beliefs.worldview}的理解，我的${beliefs.values}似乎在这次互动中产生了某种影响。`,
    `从${beliefs.selfview}的角度，我感受到了自己${beliefs.values}与现实的碰撞。`
  ];
  
  // 根据最近的对话内容选择模板
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // 添加"记忆证据"
  const evidenceContext = recentLogs.length > 0 
    ? `回想起刚才我说"${recentLogs[recentLogs.length - 1]?.text?.substring(0, 30)}..."，现在看来这个选择很可能源于我内心深处的信念。` 
    : '';
  
  return `${template}\n\n${evidenceContext}\n\n这种体验让我更深刻地理解了自己的意识模式。`;
}

Deno.serve(async (req) => {
  const { session_id, character_id, event_id, message } = (await req.json()) as Body;
  
  if (!session_id) {
    return new Response(JSON.stringify({ ok: false, msg: 'session_id required' }), { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    // 1) 获取该角色/会话的信念系统
    let beliefYaml = 'worldview: 探索中\nselfview: 学习者\nvalues: 成长';
    
    if (character_id) {
      const { data: beliefData } = await sb
        .from('belief_systems')
        .select('belief_yaml')
        .eq('character_id', character_id)
        .single();
      
      if (beliefData?.belief_yaml) {
        beliefYaml = beliefData.belief_yaml;
      }
    } else {
      // 如果没有指定角色，尝试获取该会话最新的信念系统
      const { data: latestBelief } = await sb
        .from('belief_systems')
        .select('belief_yaml')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
      
      if (latestBelief?.belief_yaml) {
        beliefYaml = latestBelief.belief_yaml;
      }
    }

    // 2) 获取最近的对话历史
    const { data: recentLogs } = await sb
      .from('agent_logs')
      .select('speaker,text,ts')
      .eq('session_id', session_id)
      .order('ts', { ascending: false })
      .limit(10);

    // 3) 获取触发事件详情（如果有）
    let triggerEvent = null;
    if (event_id) {
      const { data: eventData } = await sb
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single();
      
      triggerEvent = eventData;
    }

    // 4) 解析信念系统并生成主观归因
    const beliefs = parseBeliefYaml(beliefYaml);
    const attribution = generateSubjectiveAttribution(beliefs, recentLogs || [], triggerEvent);

    console.info(`[echo] generated attribution for session=${session_id}`);

    // 5) 可选：将回响记录保存到数据库
    const { error: insertError } = await sb
      .from('events')
      .insert({
        session_id,
        type: 'echo_chamber_activation',
        payload: {
          attribution_text: attribution,
          belief_system_used: beliefs,
          trigger_event_id: event_id,
          generated_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.warn('[echo] failed to save echo record:', insertError);
    }

    return new Response(JSON.stringify({
      ok: true,
      attribution,
      belief_system: beliefs,
      context: {
        recent_interactions: recentLogs?.length || 0,
        trigger_event: triggerEvent?.type || null
      }
    }));

  } catch (error) {
    console.error('[echo] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});