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
    console.log('Echo API 被调用');
    
    // 解析请求体
    const body = await request.json();
    const { player_id, confusion, context } = body;
    
    console.log('玩家ID:', player_id);
    console.log('玩家困惑:', confusion);
    console.log('相关情境:', context);

    // 校验必要参数
    if (!player_id || !confusion) {
      return NextResponse.json(
        { error: 'player_id 和 confusion 参数是必需的' },
        { status: 400 }
      );
    }

    // 检查 API Key
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: '服务器配置错误: 缺少 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 尝试从数据库获取玩家的信念系统
    const { data: beliefData, error: beliefError } = await supabase
      .from('belief_systems')
      .select('belief_yaml')
      .eq('character_id', player_id)
      .single();

    // 获取玩家最近的行为日志（用于生成记忆证据）
    const { data: recentLogs, error: logsError } = await supabase
      .from('agent_logs')
      .select('action_type, input, output, timestamp')
      .eq('character_id', player_id)
      .order('timestamp', { ascending: false })
      .limit(5);

    // 构建系统提示词
    let systemPrompt = `你是一个深度的内省助手，帮助玩家理解自己的内在信念和行为模式。

玩家遇到了困惑，需要你从他自己的角度给出主观的、第一人称的解释。

任务要求：
1. 以第一人称（"我"）的视角回答
2. 基于玩家的信念系统和经历提供解释
3. 语气要有情感共鸣，像是内心的声音
4. 包含1-2条具体的记忆或经历作为证据
5. 回答要在150-300字之间

`;

    // 如果有信念系统数据，加入到提示中
    if (beliefData && !beliefError) {
      systemPrompt += `玩家的信念系统：
${beliefData.belief_yaml}

`;
    } else {
      systemPrompt += `玩家的信念系统：暂未分析出明确的信念模式，请基于一般的人性和情感来回应。

`;
    }

    // 如果有行为日志，加入到提示中
    if (recentLogs && !logsError && recentLogs.length > 0) {
      systemPrompt += `玩家最近的行为记录：
`;
      recentLogs.forEach((log, index) => {
        systemPrompt += `${index + 1}. ${log.action_type}: ${log.input} -> ${log.output}\n`;
      });
      systemPrompt += `
`;
    }

    systemPrompt += `请基于以上信息，以第一人称回答玩家的困惑。`;

    // 构建用户消息
    const userMessage = `我的困惑：${confusion}

${context ? `相关情境：${context}` : ''}

请帮我理解这种情况，用我自己的内心声音告诉我为什么会这样。`;

    // 调用AI生成回响解释
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.8, // 稍高的温度以增加情感色彩
    });

    const echoResponse = completion.choices[0]?.message?.content || '抱歉，我无法为你生成内省回应。';

    // 记录回响之室的使用
    await supabase.from('agent_logs').insert({
      character_id: player_id,
      scene_id: 'echo_chamber',
      action_type: 'introspection',
      input: confusion,
      output: echoResponse,
      metadata: { 
        has_belief_system: !!beliefData,
        context: context || null
      }
    });

    // 构建回复
    const response = {
      echo: echoResponse,
      player_id: player_id,
      timestamp: new Date().toISOString(),
      has_belief_data: !!beliefData
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Echo API 错误:', error);
    
    // 处理特定错误
    if (error?.status === 429) {
      return NextResponse.json(
        { error: '请求过于频繁，请等待后重试' },
        { status: 429 }
      );
    }
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: `API 认证失败: ${error.message || 'API Key 无效'}` },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '回响之室服务暂时不可用，请稍后再试' },
      { status: 500 }
    );
  }
}

// 禁用其他 HTTP 方法
export async function GET() {
  return NextResponse.json(
    { error: '此端点仅支持 POST 请求' },
    { status: 405 }
  );
}
