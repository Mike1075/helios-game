import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, checkSupabaseConfig } from '@/lib/supabase-admin';

// Vercel AI Gateway配置
const VERCEL_AI_GATEWAY_URL = process.env.VERCEL_AI_GATEWAY_URL || 'https://api.vercel.com/v1/ai';
const VERCEL_AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY!;

interface EchoRequest {
  player_id: string;
  event_id?: string;
  trigger_context?: string;
  player_name?: string;
}

interface BeliefSystem {
  worldview: string[];
  selfview: string[];
  values: string[];
  confidence_score: number;
}

/**
 * 回响之室API - 生成基于信念系统的主观因果解释
 * 
 * 当玩家遭遇认知失调时，回响之室帮助玩家理解"为什么会这样"
 * 通过主观的、第一人称的因果解释，基于玩家的信念系统
 */
export async function POST(request: NextRequest) {
  try {
    const { player_id, event_id, trigger_context, player_name }: EchoRequest = await request.json();
    
    console.log(`🔮 回响之室被触发 - 玩家: ${player_name || player_id}`);
    
    if (!player_id) {
      return NextResponse.json({
        success: false,
        error: '缺少玩家ID'
      });
    }

    // 检查环境变量
    if (!VERCEL_AI_GATEWAY_API_KEY) {
      console.error('❌ 回响之室: AI Gateway API Key缺失');
      return NextResponse.json({
        success: false,
        error: '回响之室暂时无法访问 - AI Gateway API Key未配置'
      }, { status: 500 });
    }
    
    // 1. 获取玩家的信念系统
    console.log('📚 获取玩家信念系统...');
    const { data: beliefData, error: beliefError } = await supabaseAdmin
      .from('belief_systems')
      .select('worldview, selfview, values, confidence_score, last_updated, based_on_logs_count')
      .eq('character_id', player_id)
      .single();
    
    let beliefSystem: BeliefSystem;
    
    if (beliefError || !beliefData) {
      console.warn('⚠️ 未找到玩家信念系统，创建默认信念');
      // 创建基础信念系统
      beliefSystem = await createDefaultBeliefSystem(player_id, player_name || '玩家');
    } else {
      beliefSystem = beliefData;
    }
    
    // 2. 获取玩家最近的经历和行为
    console.log('📝 获取玩家最近经历...');
    const { data: recentEvents } = await supabaseAdmin
      .from('scene_events')
      .select('*')
      .eq('scene_id', 'moonlight_tavern')
      .gte('timestamp', Date.now() - 600000) // 最近10分钟
      .order('timestamp', { ascending: false })
      .limit(10);
    
    // 3. 获取玩家的内心活动记录
    const { data: privateLogs } = await supabaseAdmin
      .from('agent_logs')
      .select('content, timestamp, event_type')
      .eq('character_id', player_id)
      .gte('timestamp', Date.now() - 600000) // 最近10分钟
      .order('timestamp', { ascending: false })
      .limit(5);
    
    // 4. 生成回响之室内容
    console.log('✨ 生成回响之室内容...');
    const echoContent = await generateEchoContent(
      beliefSystem,
      recentEvents || [],
      privateLogs || [],
      trigger_context || '你感到了某种内心的冲突和疑惑...',
      player_name || player_id
    );
    
    // 5. 记录回响之室体验到数据库
    const echoEventId = `echo_${player_id}_${Date.now()}`;
    await supabaseAdmin
      .from('scene_events')
      .insert({
        id: echoEventId,
        scene_id: 'chamber_of_echoes',
        character_id: 'echo_guide',
        event_type: 'echo_session',
        content: `${player_name || '玩家'}进入了回响之室，开始深度自省...`,
        timestamp: Date.now(),
        metadata: {
          player_id,
          trigger_context,
          belief_confidence: beliefSystem.confidence_score,
          echo_content: echoContent,
          session_type: 'cognitive_dissonance_resolution'
        }
      });
    
    console.log(`🔮 回响之室会话完成 - ${echoEventId}`);
    
    return NextResponse.json({
      success: true,
      echo_content: echoContent,
      session_id: echoEventId,
      belief_system_strength: beliefSystem.confidence_score
    });
    
  } catch (error) {
    console.error('❌ 回响之室错误:', error);
    return NextResponse.json({
      success: false,
      error: `回响之室处理失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 生成回响之室内容 - 核心逻辑
 */
async function generateEchoContent(
  beliefSystem: BeliefSystem,
  recentEvents: any[],
  privateLogs: any[],
  triggerContext: string,
  playerName: string
): Promise<any> {
  try {
    // 构建AI提示词
    const systemPrompt = `你是"回响之室"的引导者，一个帮助人们理解内心世界的神秘存在。

你的任务是基于玩家的信念系统，为他们提供主观的、第一人称的因果解释，帮助他们理解"为什么会这样发生"。

玩家${playerName}的信念系统：
世界观: ${beliefSystem.worldview.join(', ')}
自我认知: ${beliefSystem.selfview.join(', ')}
核心价值观: ${beliefSystem.values.join(', ')}
信念成熟度: ${(beliefSystem.confidence_score * 100).toFixed(1)}%

最近经历的事件:
${recentEvents.map(event => `- ${event.character_id}: ${event.content}`).join('\n')}

内心活动记录:
${privateLogs.map(log => `- ${log.content}`).join('\n')}

认知失调触发情境: ${triggerContext}

请生成JSON格式的回响内容：
{
  "subjective_explanation": "基于玩家信念的第一人称主观解释(150-200字，深度内省)",
  "supporting_memories": ["2-3个支持这种解释的'记忆片段'或'直觉感受'"],
  "belief_connection": "这个经历如何与你的核心信念产生共鸣或冲突",
  "emotional_resonance": "这种理解带来的情感体验和内在觉醒",
  "wisdom_insight": "从这个体验中获得的智慧洞察",
  "action_suggestions": ["2-3个基于这种理解的具体行动建议"]
}

重要原则：
1. 严格使用第一人称（"我"、"我的"、"我感到"）
2. 解释必须完全基于玩家的信念系统，体现他们的世界观和价值观
3. 提供深度而温暖的内省体验，不是冰冷的分析
4. 语言要富有诗意和哲学深度，但保持易懂
5. 承认困惑和矛盾是成长的一部分
6. 避免说教，更多是陪伴式的理解和启发`;

    const userPrompt = `玩家${playerName}现在正经历认知冲突：${triggerContext}

基于他们的信念系统和最近的经历，请帮助他们进行深度的自我理解和反思。这是一个内心探索的神圣时刻。`;

    // 调用AI生成响应
    const response = await fetch(`${VERCEL_AI_GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'alibaba/qwen-2.5-14b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI Gateway响应错误: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices[0].message.content;

    // 解析JSON响应
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        generated_at: Date.now(),
        belief_alignment_score: beliefSystem.confidence_score
      };
    }

    // 如果AI没有返回正确格式，使用基于信念的备用内容
    return createFallbackEchoContent(beliefSystem, triggerContext, playerName);

  } catch (error) {
    console.error('生成回响内容失败:', error);
    return createFallbackEchoContent(beliefSystem, triggerContext, playerName);
  }
}

/**
 * 创建默认信念系统
 */
async function createDefaultBeliefSystem(playerId: string, playerName: string): Promise<BeliefSystem> {
  const defaultBelief: BeliefSystem = {
    worldview: ['世界充满未知的可能性', '每个人都有自己独特的人生故事', '真相往往隐藏在表面之下'],
    selfview: ['我是一个好奇的探索者', '我愿意面对未知和挑战', '我的经历塑造了独特的我'],
    values: ['真实', '理解', '成长', '勇气'],
    confidence_score: 0.3
  };

  try {
    await supabaseAdmin
      .from('belief_systems')
      .insert({
        character_id: playerId,
        worldview: defaultBelief.worldview,
        selfview: defaultBelief.selfview,
        values: defaultBelief.values,
        last_updated: Date.now(),
        based_on_logs_count: 0,
        confidence_score: defaultBelief.confidence_score
      });
    
    console.log(`✨ 为${playerName}创建了初始信念系统`);
    return defaultBelief;
  } catch (error) {
    console.error('创建默认信念系统失败:', error);
    return defaultBelief;
  }
}

/**
 * 创建备用回响内容
 */
function createFallbackEchoContent(beliefSystem: BeliefSystem, triggerContext: string, playerName: string): any {
  return {
    subjective_explanation: `我感到内心深处有什么东西被触动了。${triggerContext}这让我想起了自己一直相信的：${beliefSystem.worldview[0]}。或许这个困惑不是偶然，而是我内心某种更深层理解正在觉醒的信号。我意识到，正是因为我${beliefSystem.selfview[0]}，所以这个体验对我有特殊的意义。`,
    
    supporting_memories: [
      '我记得之前也有过类似的内心冲突，但最终都让我更了解自己',
      '我的直觉告诉我，这种困惑背后藏着重要的洞察',
      '每当我坚持自己的价值观时，世界总会以意外的方式回应我'
    ],
    
    belief_connection: `这个体验与我的核心价值观"${beliefSystem.values.join('、')}"产生了深刻的共鸣。它挑战了我的某些假设，但也证实了我对${beliefSystem.worldview[0]}的信念。`,
    
    emotional_resonance: '我感到一种复杂而深刻的情感：既有困惑带来的不安，也有即将理解某种真理的兴奋。这种感受本身就很有意义。',
    
    wisdom_insight: '真正的成长往往伴随着内心的冲突。我开始理解，困惑不是我的敌人，而是智慧的前奏。',
    
    action_suggestions: [
      '花时间静静地感受这种内心的变化，不要急于寻求答案',
      '相信自己的感受和直觉，它们往往比理性分析更准确',
      '保持开放的心态，允许自己的信念在体验中自然演化'
    ],
    
    generated_at: Date.now(),
    belief_alignment_score: beliefSystem.confidence_score
  };
}

/**
 * 获取回响之室状态信息
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Chamber of Echoes API - 回响之室',
    endpoints: ['POST /api/echo'],
    description: '基于玩家信念系统生成主观因果解释的深度内省空间',
    features: [
      '基于个人信念系统的主观解释',
      '第一人称内省体验',
      '认知失调的智慧转化',
      '行动建议和内在指引'
    ]
  });
}