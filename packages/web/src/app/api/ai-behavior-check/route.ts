import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务端key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * AI自主行为检查API
 * 检查角色状态并生成自主行为
 */
export async function POST(request: NextRequest) {
  try {
    const { timestamp, trigger_source } = await request.json();
    
    console.log(`🤖 AI行为检查开始 - 触发源: ${trigger_source}`);
    
    // 1. 获取所有AI角色的状态
    const { data: characterStates, error: statesError } = await supabaseAdmin
      .from('character_states')
      .select('*')
      .in('character_id', ['linxi', 'chenhao']);
    
    // 2. 获取最近的场景事件（检查是否有需要响应的对话）
    const { data: recentEvents, error: eventsError } = await supabaseAdmin
      .from('scene_events')
      .select('*')
      .eq('scene_id', 'moonlight_tavern')
      .gte('timestamp', timestamp - 120000) // 最近2分钟的事件
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (statesError) {
      console.error('获取角色状态失败:', statesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch character states'
      });
    }
    
    if (!characterStates || characterStates.length === 0) {
      return NextResponse.json({
        success: true,
        actions_generated: 0,
        message: 'No character states found'
      });
    }
    
    const results = [];
    const events = [];
    
    // 2. 检查每个角色是否需要自主行为
    for (const state of characterStates) {
      // 检查基于状态的自主行为
      const shouldAct = checkShouldAct(state, timestamp);
      
      // 检查基于对话的响应行为
      const shouldRespond = checkShouldRespondToEvents(state, recentEvents || [], timestamp);
      
      if (shouldAct.should || shouldRespond.should) {
        const reason = shouldRespond.should ? shouldRespond.reason : shouldAct.reason;
        console.log(`🎭 ${state.character_id} 需要行动: ${reason}`);
        
        // 生成简单的自主行为
        const action = generateSimpleAction(state, timestamp, shouldRespond.should ? 'response' : 'autonomous');
        
        if (action) {
          // 更新最后自主行为时间
          await supabaseAdmin
            .from('character_states')
            .update({
              last_autonomous_action: timestamp,
              boredom: Math.max(0, state.boredom - 25) // 行动后减少无聊值
            })
            .eq('character_id', state.character_id);
          
          // 创建事件记录
          const eventData = {
            id: `ai_action_${state.character_id}_${timestamp}`,
            scene_id: 'moonlight_tavern',
            character_id: state.character_id,
            event_type: action.type,
            content: action.content,
            timestamp: timestamp,
            is_autonomous: true,
            metadata: {
              trigger_reason: shouldAct.reason,
              boredom_before: state.boredom,
              api_generated: true
            }
          };
          
          // 保存事件到数据库
          const { error: eventError } = await supabaseAdmin
            .from('scene_events')
            .insert(eventData);
            
          if (eventError) {
            console.error(`保存${state.character_id}事件失败:`, eventError);
          } else {
            events.push(eventData);
            results.push({
              character_id: state.character_id,
              action,
              success: true
            });
          }
        }
      } else {
        console.log(`😴 ${state.character_id} 不需要行动: ${shouldAct.reason}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      actions_generated: results.length,
      events,
      results,
      timestamp
    });
    
  } catch (error) {
    console.error('❌ AI行为检查失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: `AI behavior check failed: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    );
  }
}

/**
 * 检查角色是否应该响应最近的事件
 */
function checkShouldRespondToEvents(state: any, recentEvents: any[], now: number): { should: boolean; reason: string } {
  if (!recentEvents || recentEvents.length === 0) {
    return { should: false, reason: '没有最近事件' };
  }
  
  const characterId = state.character_id;
  
  for (const event of recentEvents) {
    // 跳过自己的事件
    if (event.character_id === characterId) continue;
    
    // 跳过系统事件和太久的事件
    if (event.character_id === 'system' || (now - event.timestamp) > 60000) continue;
    
    const content = event.content?.toLowerCase() || '';
    
    // 检查是否被直接提及
    if (content.includes(getCharacterMentionName(characterId))) {
      return {
        should: true,
        reason: `被${event.character_id}直接提及`
      };
    }
    
    // 林溪对调查相关话题感兴趣
    if (characterId === 'linxi') {
      const investigativeKeywords = ['调查', '秘密', '真相', '可疑', '奇怪', '隐藏', '发现'];
      if (investigativeKeywords.some(keyword => content.includes(keyword))) {
        return {
          should: true,
          reason: `对调查话题感兴趣: ${event.content.substring(0, 20)}...`
        };
      }
    }
    
    // 陈浩对友善对话和服务相关话题感兴趣
    if (characterId === 'chenhao') {
      const serviceKeywords = ['酒', '服务', '帮助', '需要', '想要', '请问'];
      if (serviceKeywords.some(keyword => content.includes(keyword))) {
        return {
          should: true,
          reason: `对服务话题感兴趣: ${event.content.substring(0, 20)}...`
        };
      }
    }
    
    // 如果是新角色出现，有一定概率关注
    if (event.metadata?.character_creation && Math.random() < 0.6) {
      return {
        should: true,
        reason: `注意到新角色${event.metadata.character_data?.name}的出现`
      };
    }
  }
  
  return { should: false, reason: '没有感兴趣的事件' };
}

/**
 * 获取角色的提及名称
 */
function getCharacterMentionName(characterId: string): string {
  switch (characterId) {
    case 'linxi': return '林溪';
    case 'chenhao': return '陈浩';
    default: return characterId;
  }
}

/**
 * 检查角色是否应该执行自主行为
 */
function checkShouldAct(state: any, now: number): { should: boolean; reason: string } {
  // 冷却时间检查 (1分钟)
  const timeSinceLastAction = now - (state.last_autonomous_action || 0);
  const cooldownMs = 60 * 1000; // 1分钟
  
  if (timeSinceLastAction < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastAction) / 1000);
    return {
      should: false,
      reason: `冷却中(还需${remainingSeconds}秒)`
    };
  }
  
  // 无聊值驱动（主要驱动力）
  if (state.boredom > 50) {
    return {
      should: true,
      reason: `无聊值过高(${state.boredom.toFixed(1)})`
    };
  }
  
  if (state.boredom > 35 && Math.random() < 0.7) {
    return {
      should: true,
      reason: `无聊值较高(${state.boredom.toFixed(1)})，70%概率触发`
    };
  }
  
  // 高能量+高好奇心
  if (state.energy > 70 && state.curiosity > 60 && Math.random() < 0.4) {
    return {
      should: true,
      reason: `高能量(${state.energy.toFixed(1)})和高好奇心(${state.curiosity.toFixed(1)})`
    };
  }
  
  // 角色特有触发条件
  if (state.character_id === 'linxi' && state.suspicion > 60 && Math.random() < 0.3) {
    return {
      should: true,
      reason: `林溪怀疑度较高(${state.suspicion.toFixed(1)})`
    };
  }
  
  if (state.character_id === 'chenhao' && state.anxiety > 70 && Math.random() < 0.2) {
    return {
      should: true,
      reason: `陈浩焦虑度较高(${state.anxiety.toFixed(1)})`
    };
  }
  
  return {
    should: false,
    reason: `所有条件都不满足`
  };
}

/**
 * 生成简单的自主行为
 */
function generateSimpleAction(state: any, timestamp: number, actionType: 'autonomous' | 'response' = 'autonomous'): { type: string; content: string } | null {
  const characterId = state.character_id;
  
  // 林溪的行为模式
  if (characterId === 'linxi') {
    if (actionType === 'response') {
      // 响应型行为（对其他角色的话题回应）
      const linxiResponses = [
        { type: 'dialogue', content: '有意思...这确实值得关注' },
        { type: 'action', content: '林溪抬起头，目光敏锐地看向说话的人' },
        { type: 'dialogue', content: '你刚才说的，能再详细一些吗？' },
        { type: 'action', content: '林溪放下酒杯，显然被刚才的话题吸引了注意' }
      ];
      return linxiResponses[Math.floor(Math.random() * linxiResponses.length)];
    } else {
      // 自主行为
      const linxiActions = [
        { type: 'action', content: '林溪环视四周，锐利的目光扫过每一个角落' },
        { type: 'dialogue', content: '这里似乎隐藏着什么...' },
        { type: 'action', content: '林溪拿起酒杯，若有所思地品着酒' },
        { type: 'dialogue', content: '今晚这里的气氛有些不寻常' },
        { type: 'action', content: '林溪轻敲桌面，似乎在思考什么重要的事情' }
      ];
      return linxiActions[Math.floor(Math.random() * linxiActions.length)];
    }
  }
  
  // 陈浩的行为模式
  if (characterId === 'chenhao') {
    if (actionType === 'response') {
      // 响应型行为（友善回应）
      const chenhaoResponses = [
        { type: 'dialogue', content: '哦？看起来你们在聊有趣的事情' },
        { type: 'action', content: '陈浩放下手中的活，转身关注着对话' },
        { type: 'dialogue', content: '需要我帮什么忙吗？' },
        { type: 'action', content: '陈浩温和地笑了笑，似乎对谈话内容很感兴趣' }
      ];
      return chenhaoResponses[Math.floor(Math.random() * chenhaoResponses.length)];
    } else {
      // 自主行为
      const chenhaoActions = [
        { type: 'dialogue', content: '嗯，刚温了壶酒，坐吧。' },
        { type: 'action', content: '陈浩友善地朝新来的客人点头示意' },
        { type: 'dialogue', content: '今天的月色真美，适合小酌几杯' },
        { type: 'action', content: '陈浩整理着桌上的酒杯，动作轻柔而细致' },
        { type: 'dialogue', content: '要不要来点什么？我这里有上好的花雕' }
      ];
      return chenhaoActions[Math.floor(Math.random() * chenhaoActions.length)];
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Behavior Check API',
    endpoints: ['POST /api/ai-behavior-check'],
    description: '检查AI角色状态并触发自主行为'
  });
}