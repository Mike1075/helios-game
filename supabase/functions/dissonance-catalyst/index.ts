// supabase/functions/dissonance-catalyst/index.ts
// Helios v4.1 "本我之镜" - 认知失调催化剂，检测信念与行为的冲突
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { 
  character_id?: string;
  session_id?: string;
  trigger_type?: string;
};

interface LogEntry {
  action_type: string;
  speaker: string;
  text: string;
  ts: string;
}

// 更智能的认知失调检测算法，基于角色信念系统
function calculateDissonanceScore(logs: LogEntry[], beliefContext: any): number {
  let dissonanceScore = 0;
  
  // 基于信念的冲突检测词汇
  const intentionKeywords = ['想要', '希望', '计划', '决定', '应该', '必须'];
  const negativeOutcomes = ['失败', '拒绝', '不行', '不可以', '不能', '禁止'];
  const emotionalConflict = ['但是', '然而', '可是', '不过', '虽然', '尽管', '矛盾'];
  
  // 检测最近的交互模式
  for (let i = 0; i < logs.length - 1; i++) {
    const current = logs[i];
    const next = logs[i + 1];
    
    // 1. 检测意图与结果的冲突
    if (current.speaker !== next.speaker) {
      const currentText = current.text.toLowerCase();
      const nextText = next.text.toLowerCase();
      
      // 表达积极意图，但得到消极反馈
      const hasIntention = intentionKeywords.some(keyword => currentText.includes(keyword));
      const hasNegativeOutcome = negativeOutcomes.some(keyword => nextText.includes(keyword));
      
      if (hasIntention && hasNegativeOutcome) {
        dissonanceScore += 2.5;
      }
      
      // 检测明显的矛盾表述
      const hasEmotionalConflict = emotionalConflict.some(keyword => nextText.includes(keyword));
      if (hasEmotionalConflict) {
        dissonanceScore += 1.5;
      }
    }
    
    // 2. 检测同一角色的内部矛盾
    if (current.speaker === next.speaker) {
      const timeDiff = new Date(next.ts).getTime() - new Date(current.ts).getTime();
      // 短时间内态度转变，可能是认知失调
      if (timeDiff < 60000) { // 1分钟内
        const hasConflictPattern = emotionalConflict.some(keyword => 
          next.text.toLowerCase().includes(keyword)
        );
        if (hasConflictPattern) {
          dissonanceScore += 1.8;
        }
      }
    }
  }
  
  // 3. 基于行为频率的失调检测
  const actionTypes = logs.map(log => log.action_type);
  const uniqueActions = new Set(actionTypes);
  
  // 如果行为模式突然变化，可能存在认知失调
  if (uniqueActions.size > actionTypes.length * 0.8) {
    dissonanceScore += 1.0;
  }
  
  return dissonanceScore;
}

Deno.serve(async (req) => {
  const { character_id, session_id, trigger_type } = (await req.json()) as Body;
  
  if (!character_id) {
    return new Response(JSON.stringify({ ok: false, msg: 'character_id required' }), { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    // 1) 获取角色信息和信念系统
    const { data: character } = await sb
      .from('characters')
      .select('*, belief_systems(*)')
      .eq('id', character_id)
      .single();

    if (!character) {
      return new Response(JSON.stringify({ ok: false, msg: 'character not found' }), { status: 404 });
    }

    // 2) 获取最近的交互记录
    const { data: logs } = await sb
      .from('agent_logs')
      .select('action_type,speaker,text,ts')
      .eq('character_id', character_id)
      .order('ts', { ascending: false })
      .limit(20);

    if (!logs || logs.length < 3) {
      return new Response(JSON.stringify({ ok: true, msg: 'insufficient_data_for_analysis' }));
    }

    // 3) 计算认知失调分数
    const beliefContext = character.belief_systems?.[0] || {};
    const dissonanceScore = calculateDissonanceScore(logs.reverse(), beliefContext);
    
    console.info(`[dissonance-catalyst] character=${character.name}, score=${dissonanceScore}, trigger=${trigger_type}`);

    // 4) 动态阈值：根据角色类型和历史调整
    let threshold = 3.0;
    if (character.is_player) {
      threshold = 2.5; // 玩家更敏感
    } else if (character.tags?.includes('emotional')) {
      threshold = 2.0; // 情感型角色更容易失调
    }
    
    // 5) 如果超过阈值，创建认知失调事件
    if (dissonanceScore >= threshold) {
      const { error } = await sb
        .from('events')
        .insert({
          character_id,
          session_id: session_id || 'unknown',
          scene_id: 'harbor_tavern',
          type: 'cognitive_dissonance',
          payload: {
            dissonance_score: dissonanceScore,
            threshold_used: threshold,
            trigger_reason: 'belief_behavior_conflict',
            character_name: character.name,
            character_role: character.role,
            analysis_context: {
              recent_interactions_count: logs.length,
              belief_system_present: !!beliefContext.belief_yaml,
              trigger_type: trigger_type || 'automatic'
            },
            sample_interactions: logs.slice(-3).map(log => ({
              action_type: log.action_type,
              text: log.text.substring(0, 80),
              ts: log.ts
            }))
          }
        });

      if (error) {
        console.error('[dissonance-catalyst] failed to insert event:', error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      }

      console.info(`[dissonance-catalyst] triggered echo chamber for ${character.name} (score: ${dissonanceScore})`);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      character_name: character.name,
      dissonance_score: dissonanceScore,
      threshold: threshold,
      threshold_met: dissonanceScore >= threshold,
      interactions_analyzed: logs.length
    }));
    
  } catch (error) {
    console.error('[dissonance-catalyst] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});