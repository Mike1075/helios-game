import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务端key进行数据库操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface DissonanceTriggerRequest {
  playerId: string;
  playerName: string;
  triggerContext?: string;
  triggerType?: 'manual' | 'automated' | 'test';
}

/**
 * 认知失调触发API
 * 
 * 用于测试和模拟认知失调的检测，触发回响之室邀请
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      playerId, 
      playerName,
      triggerContext = "你在酒馆中的经历让你感到某种内心的冲突...",
      triggerType = 'manual'
    }: DissonanceTriggerRequest = await request.json();
    
    console.log(`🧠 认知失调触发请求 - 玩家: ${playerName} (${playerId}), 类型: ${triggerType}`);
    
    if (!playerId) {
      return NextResponse.json({
        success: false,
        error: '缺少玩家ID'
      });
    }
    
    // 1. 检查玩家是否已有信念系统
    const { data: beliefData } = await supabaseAdmin
      .from('belief_systems')
      .select('confidence_score, based_on_logs_count')
      .eq('character_id', playerId)
      .single();
    
    // 2. 创建认知失调事件
    const dissonanceEventId = `dissonance_${playerId}_${Date.now()}`;
    
    const dissonanceEvent = {
      id: dissonanceEventId,
      scene_id: 'moonlight_tavern',
      character_id: 'system',
      event_type: 'cognitive_dissonance',
      content: `${playerName}感受到了内心深处的某种冲突...`,
      timestamp: Date.now(),
      is_autonomous: false,
      metadata: {
        player_id: playerId,
        player_name: playerName,
        trigger_context: triggerContext,
        trigger_type: triggerType,
        belief_confidence: beliefData?.confidence_score || 0.3,
        logs_analyzed: beliefData?.based_on_logs_count || 0,
        dissonance_strength: calculateDissonanceStrength(triggerType),
        invitation_to_chamber: true
      }
    };
    
    // 3. 保存认知失调事件到数据库
    const { error: eventError } = await supabaseAdmin
      .from('scene_events')
      .insert(dissonanceEvent);
    
    if (eventError) {
      console.error('保存认知失调事件失败:', eventError);
      return NextResponse.json({
        success: false,
        error: '保存事件失败'
      });
    }
    
    // 4. 记录到agent_logs用于信念系统分析
    await supabaseAdmin
      .from('agent_logs')
      .insert({
        character_id: playerId,
        content: `认知失调事件: ${triggerContext}`,
        timestamp: Date.now(),
        event_type: 'cognitive_dissonance',
        metadata: {
          dissonance_event_id: dissonanceEventId,
          trigger_type: triggerType,
          auto_generated: true
        }
      });
    
    // 5. 发送回响之室邀请通知
    console.log(`🔮 为${playerName}生成回响之室邀请 - 事件ID: ${dissonanceEventId}`);
    
    return NextResponse.json({
      success: true,
      message: `认知失调已触发，回响之室邀请已发送`,
      dissonance_event: dissonanceEvent,
      chamber_invitation: {
        event_id: dissonanceEventId,
        trigger_context: triggerContext,
        recommended_action: 'open_chamber_of_echoes'
      }
    });
    
  } catch (error) {
    console.error('❌ 认知失调触发失败:', error);
    return NextResponse.json({
      success: false,
      error: `认知失调触发失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 计算认知失调强度
 */
function calculateDissonanceStrength(triggerType: string): number {
  switch (triggerType) {
    case 'manual':
      return 0.7; // 手动触发，中等强度
    case 'test':
      return 0.5; // 测试触发，较低强度
    case 'automated':
      return 0.9; // 系统自动检测，高强度
    default:
      return 0.6;
  }
}

/**
 * 预设的认知失调情境
 */
export async function GET(request: NextRequest) {
  const dissonanceScenarios = [
    {
      id: 'tavern_mystery',
      context: '你在月影酒馆中观察到的人和事，与你内心的某些期望产生了微妙的冲突',
      trigger_keywords: ['神秘', '观察', '期望'],
      intensity: 0.6
    },
    {
      id: 'character_interaction',
      context: '刚才与酒馆中某个角色的互动，让你重新思考自己的某些观念',
      trigger_keywords: ['互动', '角色', '观念'],
      intensity: 0.7
    },
    {
      id: 'moral_conflict',
      context: '你发现自己的行为与内心的价值观之间存在某种张力',
      trigger_keywords: ['行为', '价值观', '张力'],
      intensity: 0.8
    },
    {
      id: 'identity_question',
      context: '这个环境让你开始质疑自己一直以来的某些自我认知',
      trigger_keywords: ['环境', '质疑', '自我认知'],
      intensity: 0.9
    },
    {
      id: 'belief_challenge',
      context: '你遇到的情况挑战了你对世界运作方式的某些根本假设',
      trigger_keywords: ['情况', '挑战', '假设'],
      intensity: 0.85
    }
  ];
  
  return NextResponse.json({
    message: 'Cognitive Dissonance Trigger API',
    scenarios: dissonanceScenarios,
    endpoints: {
      'POST /api/trigger-dissonance': '触发认知失调并邀请进入回响之室',
      'GET /api/trigger-dissonance': '获取预设的认知失调情境'
    }
  });
}