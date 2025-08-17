// supabase/functions/belief-observer/index.ts
// Helios v4.1 "本我之镜" - 基于角色行为的信念系统观察者
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { 
  character_id?: string;
  trigger_type?: string;
  record_count?: number;
};

Deno.serve(async (req) => {
  const { character_id, trigger_type, record_count } = (await req.json()) as Body;
  if (!character_id) {
    return new Response(JSON.stringify({ ok: false, msg: 'character_id required' }), { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  try {
    // 1) 获取角色基础信息
    const { data: character } = await sb
      .from('characters')
      .select('*')
      .eq('id', character_id)
      .single();

    if (!character) {
      return new Response(JSON.stringify({ ok: false, msg: 'character not found' }), { status: 404 });
    }

    // 2) 获取该角色的所有行为记录
    const { data: logs } = await sb
      .from('agent_logs')
      .select('action_type,speaker,text,input_context,output_context,ts')
      .eq('character_id', character_id)
      .order('ts', { ascending: true }); // 时间正序，观察演化过程

    if (!logs || logs.length < 5) {
      console.info(`[belief-observer] character ${character.name} has insufficient logs (${logs?.length || 0})`);
      return new Response(JSON.stringify({ ok: true, msg: 'insufficient_data' }));
    }

    // 3) 构建分析提示，遵循"本我之镜"哲学
    const prompt = `你是一个深刻的心理洞察者，正在观察角色"${character.name}"（${character.role}）的行为模式。

角色核心动机：${character.core_motivation}
角色标签：${character.tags?.join(', ') || '无'}

基于以下${logs.length}条行为记录，请深度分析并生成这个角色的内在信念系统：

${logs.map((log, i) => `${i + 1}. [${log.ts}] ${log.action_type}: ${log.text}`).join('\n')}

请生成一个YAML格式的信念系统，包含：
- worldview: 对世界本质的看法（150字内）
- selfview: 对自我身份的认知（150字内）  
- values: 核心价值观和行为驱动原则（150字内）
- behavioral_patterns: 观察到的行为模式（100字内）
- evolution_notes: 信念演化的关键节点（100字内）

要求：
1. 完全基于实际行为，不要添加未观察到的特征
2. 体现角色的真实个性，包括矛盾和复杂性
3. 使用第一人称视角描述（"我认为..."）
4. 保持与核心动机的一致性

YAML格式输出：`;

    // 4) v4.1 升级：调用真实AI进行深度分析
    let beliefYaml = await analyzeBeliefSystem(character, logs, prompt);
    
    if (!beliefYaml) {
      // 如果AI分析失败，使用基于角色动机的智能模板
      beliefYaml = generateIntelligentTemplate(character, logs, record_count || logs.length);
    }

    // 5) 更新信念系统并记录生成次数
    const { error: updateError } = await sb
      .from('belief_systems')
      .upsert({
        character_id,
        belief_yaml: beliefYaml,
        belief_summary: {
          last_analysis_date: new Date().toISOString(),
          total_logs_analyzed: logs.length,
          trigger_type: trigger_type || 'manual'
        },
        last_updated: new Date().toISOString(),
        generation_count: record_count || logs.length
      });

    if (updateError) {
      console.error('[belief-observer] failed to update belief system:', updateError);
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), { status: 500 });
    }

    console.info(`[belief-observer] updated belief system for ${character.name} (${logs.length} logs analyzed)`);

    return new Response(JSON.stringify({
      ok: true,
      character_name: character.name,
      logs_analyzed: logs.length,
      trigger_type: trigger_type || 'manual'
    }));

  } catch (error) {
    console.error('[belief-observer] error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});

/**
 * v4.1 使用AI深度分析角色行为并生成信念系统
 */
async function analyzeBeliefSystem(character: any, logs: any[], prompt: string): Promise<string | null> {
  try {
    // 使用Vercel AI Gateway进行分析
    const aiGatewayKey = Deno.env.get('AI_GATEWAY_API_KEY');
    if (!aiGatewayKey) {
      console.warn('[belief-observer] AI_GATEWAY_API_KEY not found, falling back to template');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiGatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是Helios "本我之镜"的信念观察者。基于角色行为模式生成YAML格式的信念系统。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('[belief-observer] AI API call failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;

  } catch (error) {
    console.error('[belief-observer] AI analysis error:', error);
    return null;
  }
}

/**
 * 智能模板生成器：基于角色动机和行为记录
 */
function generateIntelligentTemplate(character: any, logs: any[], recordCount: number): string {
  // 分析行为模式
  const speakerCounts = logs.reduce((acc: any, log: any) => {
    acc[log.speaker] = (acc[log.speaker] || 0) + 1;
    return acc;
  }, {});
  
  const aiResponses = logs.filter((log: any) => log.speaker === 'ai').length;
  const interactionRatio = aiResponses / logs.length;
  
  // 基于角色标签生成个性化信念
  const tags = character.tags || [];
  const personalityTraits = generatePersonalityFromTags(tags, character.core_motivation);

  return `# ${character.name} 的信念系统 - 行为观察生成 v4.1
# 基于 ${logs.length} 条行为记录，第 ${recordCount} 次信念更新

character_info:
  name: "${character.name}"
  role: "${character.role}"
  core_motivation: "${character.core_motivation}"
  analysis_depth: ${logs.length >= 20 ? 'deep' : logs.length >= 10 ? 'moderate' : 'initial'}

belief_system:
  worldview:
    primary_worldview:
      strength: ${Math.min(0.8, 0.3 + (logs.length * 0.02))}
      description: "${personalityTraits.worldview}"
      evidence_from_behavior: "基于${logs.length}次互动中的一致性表现"
      
  selfview:
    identity_belief:
      strength: ${Math.min(0.9, 0.4 + (interactionRatio * 0.5))}
      description: "${personalityTraits.selfview}"
      behavioral_consistency: "${aiResponses}/${logs.length} 的主动表达比例"
      
  values:
    core_values:
      strength: ${Math.min(0.95, 0.5 + (logs.length * 0.015))}
      description: "${personalityTraits.values}"
      motivational_alignment: "与核心动机'${character.core_motivation}'高度一致"

behavioral_patterns:
  interaction_style: "${characterizeInteractionStyle(logs)}"
  response_consistency: "${Math.round(interactionRatio * 100)}%"
  growth_trajectory: "${recordCount > 1 ? '持续演化中' : '初次建立'}"

meta:
  generation_method: "behavioral_analysis_v4.1"
  total_observations: ${logs.length}
  generated_at: "${new Date().toISOString()}"
  belief_evolution_stage: ${recordCount}
  ai_analysis_status: "fallback_template"
`;
}

/**
 * 基于角色标签生成个性化特征
 */
function generatePersonalityFromTags(tags: string[], coreMotivation: string) {
  const tagMap: { [key: string]: any } = {
    'order': {
      worldview: '世界需要规则和秩序才能正常运转，混乱只会带来痛苦',
      selfview: '我是秩序的维护者，有责任确保规则得到遵守',
      values: '正义、责任和稳定是我行动的指导原则'
    },
    'survival': {
      worldview: '世界充满不确定性，只有适应能力强的人才能生存下去',
      selfview: '我必须时刻保持警觉，依靠自己的智慧和能力生存',
      values: '自由、独立和实用主义是我的核心价值'
    },
    'knowledge': {
      worldview: '知识和智慧是理解世界的钥匙，真理值得不断探索',
      selfview: '我是智慧的寻求者，通过学习和思考来完善自己',
      values: '真理、智慧和启发他人是我存在的意义'
    },
    'business': {
      worldview: '世界是一个巨大的市场，机会和风险并存',
      selfview: '我是一个实用主义者，善于发现和创造价值',
      values: '效率、互利共赢和长期关系是我的经营之道'
    },
    'adventure': {
      worldview: '世界充满了未知的可能性，冒险让生命更有意义',
      selfview: '我是一个探索者，渴望体验生命的各种可能',
      values: '勇气、友谊和经历丰富的人生是我的追求'
    }
  };

  // 根据标签生成个性，如果没有匹配的标签，使用核心动机
  const primaryTag = tags.find(tag => tagMap[tag]) || 'default';
  const personality = tagMap[primaryTag] || {
    worldview: `基于"${coreMotivation}"的世界观正在形成中`,
    selfview: `我正在探索自己作为${coreMotivation}者的身份定位`,
    values: `${coreMotivation}相关的价值观是我行为的重要驱动力`
  };

  return personality;
}

/**
 * 分析互动风格
 */
function characterizeInteractionStyle(logs: any[]): string {
  const totalLogs = logs.length;
  const aiLogs = logs.filter(log => log.speaker === 'ai');
  
  if (aiLogs.length === 0) return '观察中';
  if (aiLogs.length / totalLogs > 0.6) return '主动交流型';
  if (aiLogs.length / totalLogs > 0.3) return '适度回应型';
  return '谨慎观察型';
}