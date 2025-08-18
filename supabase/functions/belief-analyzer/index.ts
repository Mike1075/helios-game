// Supabase Edge Function: 信念系统分析器
// 定期分析玩家行为，更新信念系统

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 初始化Supabase客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { player_id, recent_logs_count = 5 } = await req.json()

    // 1. 获取玩家最近的行为记录
    const { data: recentLogs, error: logsError } = await supabaseClient
      .from('agent_logs')
      .select('*')
      .eq('character_id', player_id)
      .order('timestamp', { ascending: false })
      .limit(recent_logs_count)

    if (logsError) {
      throw new Error(`Failed to fetch logs: ${logsError.message}`)
    }

    // 2. 调用AI分析信念系统
    const beliefAnalysisPrompt = `
分析以下玩家行为，推断其信念系统：

玩家行为记录：
${recentLogs.map((log, i) => `${i + 1}. [${log.event_type}] ${log.content}`).join('\n')}

请分析并返回JSON格式：
{
  "worldview": ["信念1", "信念2"],
  "selfview": ["自我认知1", "自我认知2"], 
  "values": ["价值观1", "价值观2"],
  "confidence_score": 0.8,
  "cognitive_dissonance_detected": false,
  "reasoning": "分析理由"
}
`

    // 调用Vercel AI Gateway
    const aiResponse = await fetch(Deno.env.get('VERCEL_AI_GATEWAY_URL') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('VERCEL_AI_GATEWAY_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'alibaba/qwen-2.5-14b-instruct',
        messages: [
          { role: 'system', content: '你是专业的行为心理学分析师，擅长从行为推断信念系统。' },
          { role: 'user', content: beliefAnalysisPrompt }
        ],
        max_tokens: 1000
      })
    })

    const aiResult = await aiResponse.json()
    const analysisText = aiResult.choices[0].message.content

    // 3. 解析AI响应
    let beliefAnalysis
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      beliefAnalysis = JSON.parse(jsonMatch[0])
    } catch {
      // 如果JSON解析失败，创建默认分析
      beliefAnalysis = {
        worldview: ["正在形成中"],
        selfview: ["正在探索中"],
        values: ["正在确立中"],
        confidence_score: 0.3,
        cognitive_dissonance_detected: false,
        reasoning: "行为数据不足，无法准确分析"
      }
    }

    // 4. 更新数据库中的信念系统
    const { error: updateError } = await supabaseClient
      .from('belief_systems')
      .upsert([{
        character_id: player_id,
        worldview: beliefAnalysis.worldview,
        selfview: beliefAnalysis.selfview,
        values: beliefAnalysis.values,
        confidence_score: beliefAnalysis.confidence_score,
        based_on_logs_count: recentLogs.length,
        last_updated: Date.now()
      }], {
        onConflict: 'character_id'
      })

    if (updateError) {
      throw new Error(`Failed to update beliefs: ${updateError.message}`)
    }

    // 5. 如果检测到认知失调，触发回响之室邀请
    if (beliefAnalysis.cognitive_dissonance_detected) {
      await supabaseClient
        .from('player_events')
        .insert([{
          player_id: player_id,
          event_type: 'cognitive_dissonance',
          content: '深度分析发现了认知冲突，建议进入回响之室探索内心。',
          trigger_data: {
            analysis_reasoning: beliefAnalysis.reasoning,
            confidence_score: beliefAnalysis.confidence_score,
            detected_at: Date.now()
          }
        }])
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_beliefs: beliefAnalysis,
        logs_analyzed: recentLogs.length,
        cognitive_dissonance_detected: beliefAnalysis.cognitive_dissonance_detected
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})