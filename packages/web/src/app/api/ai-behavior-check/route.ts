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
      const shouldAct = checkShouldAct(state, timestamp);
      
      if (shouldAct.should) {
        console.log(`🎭 ${state.character_id} 需要行动: ${shouldAct.reason}`);
        
        // 生成简单的自主行为
        const action = generateSimpleAction(state, timestamp);
        
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
function generateSimpleAction(state: any, timestamp: number): { type: string; content: string } | null {
  const characterId = state.character_id;
  
  // 林溪的行为模式
  if (characterId === 'linxi') {
    const linxiActions = [
      { type: 'action', content: '林溪环视四周，锐利的目光扫过每一个角落' },
      { type: 'dialogue', content: '这里似乎隐藏着什么...' },
      { type: 'action', content: '林溪拿起酒杯，若有所思地品着酒' },
      { type: 'dialogue', content: '今晚这里的气氛有些不寻常' },
      { type: 'action', content: '林溪轻敲桌面，似乎在思考什么重要的事情' }
    ];
    
    return linxiActions[Math.floor(Math.random() * linxiActions.length)];
  }
  
  // 陈浩的行为模式
  if (characterId === 'chenhao') {
    const chenhaoActions = [
      { type: 'dialogue', content: '嗯，刚温了壶酒，坐吧。' },
      { type: 'action', content: '陈浩友善地朝新来的客人点头示意' },
      { type: 'dialogue', content: '今天的月色真美，适合小酌几杯' },
      { type: 'action', content: '陈浩整理着桌上的酒杯，动作轻柔而细致' },
      { type: 'dialogue', content: '要不要来点什么？我这里有上好的花雕' }
    ];
    
    return chenhaoActions[Math.floor(Math.random() * chenhaoActions.length)];
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