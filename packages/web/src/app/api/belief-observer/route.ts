import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 初始化 DeepSeek 客户端
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
});

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    console.log('信念观察者被触发');
    
    // 解析请求体
    const body = await request.json();
    const { character_id, trigger_event } = body;
    
    console.log('分析角色ID:', character_id);
    console.log('触发事件:', trigger_event);

    // 校验必要参数
    if (!character_id) {
      return NextResponse.json(
        { error: 'character_id 参数是必需的' },
        { status: 400 }
      );
    }

    // 获取角色的最近行为日志（最近10条记录）
    const { data: recentLogs, error: logsError } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('character_id', character_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('获取行为日志失败:', logsError);
      return NextResponse.json(
        { error: '无法获取行为日志' },
        { status: 500 }
      );
    }

    // 获取角色当前的信念系统（如果存在）
    const { data: currentBelief, error: beliefError } = await supabase
      .from('belief_systems')
      .select('*')
      .eq('character_id', character_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 如果获取信念系统出错但不是因为没有记录，则返回错误
    if (beliefError && beliefError.code !== 'PGRST116') {
      console.error('获取信念系统失败:', beliefError);
    }

    // 构建行为历史摘要
    const behaviorSummary = recentLogs?.map(log => {
      const timeAgo = new Date(log.created_at).toLocaleString();
      return `[${timeAgo}] ${log.action_type}: ${log.input || ''} → ${log.output || ''}`;
    }).join('\n') || '暂无行为记录';

    // 构建信念分析提示词
    const beliefAnalysisPrompt = `你是一个深度心理学家和行为分析师，专门观察和分析人类的内在信念系统。

## 分析任务
根据以下一个角色的行为记录，分析并生成/更新他们的信念系统。

## 当前角色信息
角色ID: ${character_id}

## 行为历史记录
${behaviorSummary}

## 当前信念系统（如果存在）
${currentBelief ? `现有信念:\n${currentBelief.belief_yaml}` : '暂无现有信念记录'}

## 触发事件
${trigger_event || '定期分析'}

## 分析要求
请基于行为模式分析这个角色的内在信念系统，生成一个YAML格式的信念档案。

信念系统应该包含以下维度（参考但不限于）：
- **核心价值观**: 什么对他们最重要
- **世界观**: 他们如何看待世界的运行规律
- **人际关系观**: 如何看待与他人的关系
- **道德观**: 对错善恶的判断标准
- **生存观**: 如何看待生存和安全
- **权威观**: 对权威和规则的态度
- **变化观**: 对改变和稳定的偏好
- **自我认知**: 对自己能力和价值的认知

## 输出格式
请输出标准YAML格式，例如：
\`\`\`yaml
# 角色信念系统 v1.0
core_values:
  - value: "秩序与规则"
    intensity: 0.8
    evidence: "多次选择遵守规则而非便利"
    
worldview:
  - belief: "世界需要秩序才能运转"
    confidence: 0.7
    source: "观察到的行为模式"

# ... 更多维度
\`\`\`

## 分析原则
1. 基于**真实行为**而非假设
2. 识别**一致的模式**而非偶然事件  
3. 注意**信念的变化和冲突**
4. 保持**心理学的严谨性**
5. 体现**个体的独特性**

请开始分析：`;

    // 调用AI进行信念分析
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的心理学家和行为分析师，擅长通过行为模式分析人类的深层信念系统。'
        },
        {
          role: 'user',
          content: beliefAnalysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const beliefAnalysis = completion.choices[0]?.message?.content || '';
    
    console.log('信念分析结果:', beliefAnalysis);

    // 提取YAML部分（在代码块中的内容）
    const yamlMatch = beliefAnalysis.match(/```yaml\n([\s\S]*?)\n```/);
    const beliefYaml = yamlMatch ? yamlMatch[1] : beliefAnalysis;

    // 保存或更新信念系统
    const { data: savedBelief, error: saveError } = await supabase
      .from('belief_systems')
      .insert({
        character_id: character_id,
        belief_yaml: beliefYaml,
        analysis_summary: beliefAnalysis,
        trigger_event: trigger_event || 'periodic_analysis',
        confidence_score: 0.8 // 可以后续优化为动态计算
      })
      .select()
      .single();

    if (saveError) {
      console.error('保存信念系统失败:', saveError);
      return NextResponse.json(
        { error: '保存信念系统失败' },
        { status: 500 }
      );
    }

    // 记录信念观察者的运行日志
    await supabase.from('agent_logs').insert({
      character_id: 'belief_observer_system',
      scene_id: 'system',
      action_type: 'belief_analysis',
      input: `分析角色${character_id}的信念系统`,
      output: `生成信念档案，置信度: 0.8`,
      metadata: {
        analyzed_character: character_id,
        behavior_records_count: recentLogs?.length || 0,
        trigger_event: trigger_event
      }
    });

    console.log('信念系统更新成功:', savedBelief.id);

    return NextResponse.json({
      success: true,
      belief_id: savedBelief.id,
      character_id: character_id,
      belief_yaml: beliefYaml,
      analysis_summary: beliefAnalysis,
      confidence_score: 0.8,
      message: '信念系统分析完成'
    });

  } catch (error) {
    console.error('信念观察者处理失败:', error);
    return NextResponse.json(
      { error: '信念观察者系统出现异常' },
      { status: 500 }
    );
  }
}
