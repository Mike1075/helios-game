// Supabase Edge Function: AI自主行为生成器
// 根据角色状态和时间触发AI的自主行为

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. 获取所有AI角色的当前状态
    const { data: characterStates, error: statesError } = await supabaseClient
      .from('character_states')
      .select('*')
      .in('character_id', ['linxi', 'chenhao'])

    if (statesError) {
      throw new Error(`Failed to fetch character states: ${statesError.message}`)
    }

    const autonomousActions = []

    // 2. 为每个角色检查是否需要自主行为
    for (const state of characterStates) {
      const now = Date.now()
      const timeSinceLastAction = now - (state.last_autonomous_action || 0)
      
      // 检查是否应该触发自主行为
      let shouldAct = false
      let actionReason = ''

      // 基于无聊值的行为触发
      if (state.boredom > 75) {
        shouldAct = true
        actionReason = 'high_boredom'
      } else if (state.boredom > 60 && Math.random() < 0.4) {
        shouldAct = true
        actionReason = 'moderate_boredom'
      }

      // 角色特有的行为触发
      if (state.character_id === 'linxi' && state.suspicion > 70) {
        shouldAct = true
        actionReason = 'high_suspicion'
      } else if (state.character_id === 'chenhao' && state.anxiety > 70) {
        shouldAct = true
        actionReason = 'high_anxiety'
      }

      // 时间冷却检查（至少3分钟间隔）
      if (timeSinceLastAction < 180000) {
        shouldAct = false
      }

      if (shouldAct) {
        // 3. 调用AI生成自主行为
        const behaviorPrompt = `
角色：${state.character_id === 'linxi' ? '林溪（神秘调查员）' : '陈浩（焦虑年轻人）'}
当前状态：
- 能量: ${state.energy}
- 专注: ${state.focus}  
- 好奇心: ${state.curiosity}
- 无聊值: ${state.boredom}
- 焦虑: ${state.anxiety}
- 怀疑: ${state.suspicion}

触发原因: ${actionReason}
场景: 月影酒馆

请生成一个符合角色性格的自主行为，返回JSON格式：
{
  "action_type": "dialogue|action|thought",
  "content": "具体的行为内容",
  "emotion_context": "情绪描述",
  "state_changes": {
    "energy": -5,
    "boredom": -20
  }
}
`

        const aiResponse = await fetch(Deno.env.get('VERCEL_AI_GATEWAY_URL') + '/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('VERCEL_AI_GATEWAY_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'alibaba/qwen-2.5-14b-instruct',
            messages: [
              { role: 'system', content: '你是专业的角色行为生成器，根据角色状态生成合适的自主行为。' },
              { role: 'user', content: behaviorPrompt }
            ],
            max_tokens: 500
          })
        })

        const aiResult = await aiResponse.json()
        const behaviorText = aiResult.choices[0].message.content

        // 解析AI响应
        let behaviorData
        try {
          const jsonMatch = behaviorText.match(/\{[\s\S]*\}/)
          behaviorData = JSON.parse(jsonMatch[0])
        } catch {
          // 默认行为
          behaviorData = {
            action_type: "action",
            content: `${state.character_id === 'linxi' ? '林溪' : '陈浩'}静静地观察着酒馆里的情况。`,
            emotion_context: "平静观察",
            state_changes: { boredom: -10 }
          }
        }

        // 4. 记录自主行为到scene_events
        await supabaseClient
          .from('scene_events')
          .insert([{
            scene_id: 'moonlight_tavern',
            character_id: state.character_id,
            event_type: behaviorData.action_type,
            content: behaviorData.content,
            is_autonomous: true,
            emotion_context: behaviorData.emotion_context,
            timestamp: now
          }])

        // 5. 更新角色状态
        const updatedState = {
          ...state,
          last_autonomous_action: now,
          last_updated: now,
          boredom: Math.max(0, state.boredom + (behaviorData.state_changes?.boredom || -10)),
          energy: Math.max(0, Math.min(100, state.energy + (behaviorData.state_changes?.energy || -2))),
          focus: Math.max(0, Math.min(100, state.focus + (behaviorData.state_changes?.focus || 1)))
        }

        await supabaseClient
          .from('character_states')
          .update(updatedState)
          .eq('character_id', state.character_id)

        autonomousActions.push({
          character_id: state.character_id,
          action: behaviorData,
          reason: actionReason
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        actions_generated: autonomousActions.length,
        actions: autonomousActions
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