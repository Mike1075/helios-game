import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 数据库初始化API
 * 手动触发数据库表创建和初始数据设置
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ 开始初始化数据库...');

    // 1. 检查和初始化角色状态表
    const { data: existingStates, error: statesError } = await supabase
      .from('character_states')
      .select('character_id')
      .in('character_id', ['linxi', 'chenhao']);

    if (statesError) {
      console.warn('角色状态表查询失败，可能需要创建表:', statesError.message);
    }

    // 初始化或更新核心角色状态 - 设置高无聊值以便立即触发AI行动
    const coreCharacterStates = [
      {
        character_id: 'linxi',
        energy: 75.0,
        focus: 80.0,
        curiosity: 70.0,
        boredom: 60.0, // 设置为60，立即达到触发条件
        anxiety: 30.0,
        suspicion: 60.0,
        last_autonomous_action: 0,
        last_updated: Date.now()
      },
      {
        character_id: 'chenhao',
        energy: 60.0,
        focus: 50.0,
        curiosity: 80.0,
        boredom: 55.0, // 设置为55，立即达到触发条件
        anxiety: 70.0,
        suspicion: 25.0,
        last_autonomous_action: 0,
        last_updated: Date.now()
      }
    ];

    const stateResults = [];
    for (const state of coreCharacterStates) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('character_states')
        .upsert(state, { 
          onConflict: 'character_id',
          ignoreDuplicates: false 
        })
        .select();

      const result = {
        character_id: state.character_id,
        success: !upsertError,
        error: upsertError?.message || null,
        data: upsertData
      };
      stateResults.push(result);

      if (upsertError) {
        console.error(`初始化${state.character_id}状态失败:`, upsertError);
      } else {
        console.log(`✅ ${state.character_id}状态初始化成功:`, upsertData);
      }
    }

    // 2. 初始化信念系统
    const beliefSystems = [
      {
        character_id: 'linxi',
        worldview: [
          { belief: "世界充满隐藏的真相", strength: 0.9 },
          { belief: "调查是揭示真相的唯一方式", strength: 0.8 }
        ],
        selfview: [
          { belief: "我是一个专业的调查员", strength: 0.9 },
          { belief: "我有责任保护无辜的人", strength: 0.7 }
        ],
        values: [
          { belief: "真相比和谐更重要", strength: 0.8 },
          { belief: "正义必须得到伸张", strength: 0.9 }
        ],
        last_updated: Date.now(),
        based_on_logs_count: 0,
        confidence_score: 0.8
      },
      {
        character_id: 'chenhao',
        worldview: [
          { belief: "世界基本上是安全的", strength: 0.6 },
          { belief: "大多数人都是善良的", strength: 0.7 }
        ],
        selfview: [
          { belief: "我还年轻，有很多要学习", strength: 0.8 },
          { belief: "我容易相信别人", strength: 0.6 }
        ],
        values: [
          { belief: "友谊比真相更重要", strength: 0.7 },
          { belief: "应该避免冲突", strength: 0.8 }
        ],
        last_updated: Date.now(),
        based_on_logs_count: 0,
        confidence_score: 0.7
      }
    ];

    const beliefResults = [];
    for (const belief of beliefSystems) {
      const { data: beliefData, error: beliefError } = await supabase
        .from('belief_systems')
        .upsert(belief, { 
          onConflict: 'character_id',
          ignoreDuplicates: false 
        })
        .select();

      const result = {
        character_id: belief.character_id,
        success: !beliefError,
        error: beliefError?.message || null,
        data: beliefData
      };
      beliefResults.push(result);

      if (beliefError) {
        console.error(`初始化${belief.character_id}信念系统失败:`, beliefError);
      } else {
        console.log(`✅ ${belief.character_id}信念系统初始化成功:`, beliefData);
      }
    }

    // 3. 清理旧的事件（可选）
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const { error: cleanupError } = await supabase
      .from('scene_events')
      .delete()
      .lt('timestamp', oneHourAgo);

    if (cleanupError) {
      console.warn('清理旧事件失败:', cleanupError.message);
    } else {
      console.log('✅ 旧事件清理完成');
    }

    return NextResponse.json({
      success: true,
      message: '数据库初始化完成',
      details: {
        character_states: stateResults,
        belief_systems: beliefResults,
        cleanup_completed: !cleanupError
      },
      summary: {
        states_initialized: stateResults.filter(r => r.success).length,
        beliefs_initialized: beliefResults.filter(r => r.success).length,
        total_errors: [...stateResults, ...beliefResults].filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `数据库初始化失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * 获取数据库状态信息，同时执行初始化
 */
export async function GET(request: NextRequest) {
  // GET请求也执行初始化逻辑
  return POST(request);
}

