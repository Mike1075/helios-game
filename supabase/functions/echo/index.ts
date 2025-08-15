// supabase/functions/echo/index.ts
// Helios v4.1 "本我之镜" - 回响之室，生成基于信念系统的主观归因
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { 
  character_id?: string;
  session_id?: string;
  event_id?: string;
  message?: string;
  context?: string;
};

interface BeliefSystem {
  worldview: string;
  selfview: string;
  values: string;
  behavioral_patterns?: string;
  evolution_notes?: string;
}

// 增强的YAML解析器，支持更复杂的信念结构
function parseBeliefYaml(beliefYaml: string): BeliefSystem {
  const lines = beliefYaml.split('\n');
  const beliefs: any = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.includes(':') && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      if (value) {
        beliefs[key.trim()] = value;
      }
    }
  });
  
  return {
    worldview: beliefs.worldview || '我在探索这个世界的本质',
    selfview: beliefs.selfview || '我在观察和学习中成长',
    values: beliefs.values || '我重视真诚的体验',
    behavioral_patterns: beliefs.behavioral_patterns || '我的行为反映内心状态',
    evolution_notes: beliefs.evolution_notes || '我在每次经历中成长'
  };
}

// 基于"本我之镜"哲学的主观归因生成器
function generateSubjectiveAttribution(
  character: any,
  beliefs: BeliefSystem, 
  recentLogs: any[], 
  triggerEvent?: any,
  context?: string
): string {
  // 构建个性化的归因模板
  const attributionPrompts = [
    `作为${character.role}，${beliefs.worldview}这让我意识到...`,
    `从${beliefs.selfview}这个角度来看，刚才的经历...`,
    `我发现我的${beliefs.values}在这种情况下...`,
    `回顾刚才的互动，我注意到${beliefs.behavioral_patterns}...`
  ];
  
  const selectedPrompt = attributionPrompts[Math.floor(Math.random() * attributionPrompts.length)];
  
  // 构建基于最近行为的"记忆证据"
  const recentActions = recentLogs
    .filter(log => log.action_type !== 'system')
    .slice(-3)
    .map(log => `"${log.text.substring(0, 40)}..."`)
    .join('，');
  
  // 根据触发事件类型调整归因深度
  let insightLevel = '这让我对自己有了新的认识。';
  if (triggerEvent?.type === 'cognitive_dissonance') {
    insightLevel = '这种内心的矛盾感让我意识到，我的信念和行为之间存在着复杂的关系。也许这正是成长的契机。';
  }
  
  // 生成第一人称主观归因
  const attribution = `🪞 **回响之室** - ${character.name}的内心映照

${selectedPrompt}

刚才我${recentActions ? `通过${recentActions}这些行为` : '的行为'}，我看到了自己内心深处的某些模式。

**内在感受：**
${beliefs.selfview}，我感受到这次经历触动了我内心的某个层面。我的${beliefs.values}在这个过程中显现出来，这不是偶然的。

**深层洞察：**
我意识到，我的每一个选择都源于${beliefs.worldview}这样的认知框架。${beliefs.behavioral_patterns}，这让我明白了自己是如何与这个世界互动的。

**意识演化：**
${insightLevel} ${beliefs.evolution_notes}这种觉察本身就是一种成长。

*${new Date().toISOString().split('T')[0]} - 第${Math.floor(Math.random() * 100) + 1}次内省*`;

  return attribution;
}

Deno.serve(async (req) => {
  const { character_id, session_id, event_id, message, context } = (await req.json()) as Body;
  
  if (!character_id && !session_id) {
    return new Response(JSON.stringify({ ok: false, msg: 'character_id or session_id required' }), { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    let character = null;
    let beliefYaml = '';

    // 1) 获取角色信息和信念系统
    if (character_id) {
      const { data: characterData } = await sb
        .from('characters')
        .select('*, belief_systems(*)')
        .eq('id', character_id)
        .single();
      
      character = characterData;
      beliefYaml = characterData?.belief_systems?.[0]?.belief_yaml || '';
    } else {
      // 如果只有session_id，尝试推断主要角色
      const { data: sessionLogs } = await sb
        .from('agent_logs')
        .select('character_id, characters(*, belief_systems(*))')
        .eq('session_id', session_id)
        .order('ts', { ascending: false })
        .limit(10);
      
      if (sessionLogs?.[0]?.characters) {
        character = sessionLogs[0].characters;
        beliefYaml = character.belief_systems?.[0]?.belief_yaml || '';
      }
    }

    if (!character) {
      return new Response(JSON.stringify({ ok: false, msg: 'character not found' }), { status: 404 });
    }

    // 2) 获取最近的交互历史
    const { data: recentLogs } = await sb
      .from('agent_logs')
      .select('action_type,speaker,text,ts')
      .eq('character_id', character.id)
      .order('ts', { ascending: false })
      .limit(15);

    // 3) 获取触发事件（如果有）
    let triggerEvent = null;
    if (event_id) {
      const { data: eventData } = await sb
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single();
      
      triggerEvent = eventData;
    } else {
      // 查找最近的认知失调事件
      const { data: recentEvent } = await sb
        .from('events')
        .select('*')
        .eq('character_id', character.id)
        .eq('type', 'cognitive_dissonance')
        .order('ts', { ascending: false })
        .limit(1)
        .single();
      
      triggerEvent = recentEvent;
    }

    // 4) 解析信念系统并生成主观归因
    const beliefs = parseBeliefYaml(beliefYaml);
    const attribution = generateSubjectiveAttribution(
      character, 
      beliefs, 
      recentLogs || [], 
      triggerEvent,
      context
    );

    console.info(`[echo] generated attribution for ${character.name} (${character.role})`);

    // 5) 记录回响之室激活事件
    const { error: insertError } = await sb
      .from('events')
      .insert({
        character_id: character.id,
        session_id: session_id || 'unknown',
        scene_id: 'harbor_tavern',
        type: 'echo_chamber_activation',
        payload: {
          attribution_text: attribution,
          belief_system_snapshot: beliefs,
          trigger_event_id: event_id,
          context_provided: context,
          interactions_analyzed: recentLogs?.length || 0,
          generated_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.warn('[echo] failed to save echo record:', insertError);
    }

    return new Response(JSON.stringify({
      ok: true,
      attribution,
      character: {
        id: character.id,
        name: character.name,
        role: character.role
      },
      belief_system: beliefs,
      context: {
        recent_interactions: recentLogs?.length || 0,
        trigger_event: triggerEvent?.type || null,
        has_belief_system: !!beliefYaml,
        dissonance_score: triggerEvent?.payload?.dissonance_score || 0
      }
    }));

  } catch (error) {
    console.error('[echo] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});