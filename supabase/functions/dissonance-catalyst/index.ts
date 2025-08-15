// supabase/functions/dissonance-catalyst/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { session_id?: string };

interface LogEntry {
  speaker: string;
  text: string;
  ts: string;
}

// 简化的认知失调检测算法
function calculateDissonanceScore(logs: LogEntry[]): number {
  let dissonanceScore = 0;
  
  // 检测关键词冲突模式
  const positiveKeywords = ['喜欢', '同意', '支持', '赞成', '好的', '是的', '对', '正确'];
  const negativeKeywords = ['不喜欢', '反对', '拒绝', '错误', '不对', '不是', '否'];
  const conflictKeywords = ['但是', '然而', '可是', '不过', '虽然', '尽管'];
  
  for (let i = 0; i < logs.length - 1; i++) {
    const current = logs[i];
    const next = logs[i + 1];
    
    // 检测用户行为与AI反馈的冲突
    if (current.speaker === 'user' && next.speaker === 'ai') {
      const userText = current.text.toLowerCase();
      const aiText = next.text.toLowerCase();
      
      // 用户表达积极意图，但AI给出消极反馈
      const userPositive = positiveKeywords.some(keyword => userText.includes(keyword));
      const aiNegative = negativeKeywords.some(keyword => aiText.includes(keyword));
      
      if (userPositive && aiNegative) {
        dissonanceScore += 2;
      }
      
      // 检测矛盾表述
      const hasConflict = conflictKeywords.some(keyword => aiText.includes(keyword));
      if (hasConflict) {
        dissonanceScore += 1;
      }
    }
    
    // 检测用户内部矛盾
    if (current.speaker === 'user' && next.speaker === 'user') {
      const currentPositive = positiveKeywords.some(keyword => current.text.toLowerCase().includes(keyword));
      const nextNegative = negativeKeywords.some(keyword => next.text.toLowerCase().includes(keyword));
      
      if (currentPositive && nextNegative) {
        dissonanceScore += 1.5;
      }
    }
  }
  
  return dissonanceScore;
}

Deno.serve(async (req) => {
  const { session_id } = (await req.json()) as Body;
  if (!session_id) return new Response(JSON.stringify({ ok: false, msg: 'no session_id' }), { status: 400 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    // 1) 获取最近 20 条对话记录
    const { data: logs } = await sb
      .from('agent_logs')
      .select('speaker,text,ts')
      .eq('session_id', session_id)
      .order('ts', { ascending: false })
      .limit(20);

    if (!logs || logs.length < 2) {
      return new Response(JSON.stringify({ ok: true, msg: 'insufficient_data' }));
    }

    // 2) 计算认知失调分数
    const dissonanceScore = calculateDissonanceScore(logs.reverse()); // 时间正序处理
    
    console.info(`[dissonance-catalyst] session=${session_id}, score=${dissonanceScore}`);

    // 3) 如果超过阈值，写入 events 表触发回响之室
    const threshold = 3.0; // 可调整的阈值
    
    if (dissonanceScore >= threshold) {
      const { error } = await sb
        .from('events')
        .insert({
          session_id,
          type: 'cognitive_dissonance',
          payload: {
            dissonance_score: dissonanceScore,
            trigger_reason: 'belief_action_conflict',
            recent_interactions: logs.slice(-5).map(log => ({
              speaker: log.speaker,
              text: log.text.substring(0, 100), // 截取前100字符
              ts: log.ts
            }))
          }
        });

      if (error) {
        console.error('[dissonance-catalyst] failed to insert event:', error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      }

      console.info(`[dissonance-catalyst] triggered echo chamber for session=${session_id}`);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      dissonance_score: dissonanceScore,
      threshold_met: dissonanceScore >= threshold 
    }));
    
  } catch (error) {
    console.error('[dissonance-catalyst] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});