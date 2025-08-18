import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 数据库角色接口
interface Character {
  id: string;
  name: string;
  role: string;
  core_motivation: string;
  is_player: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// 初始化 DeepSeek 客户端（使用 OpenAI SDK，兼容 DeepSeek API）
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
    // 调试信息
    console.log('所有环境变量:', Object.keys(process.env).filter(key => key.includes('API')));
    console.log('DEEPSEEK_API_KEY 存在:', !!process.env.DEEPSEEK_API_KEY);
    console.log('OPENAI_API_KEY 存在:', !!process.env.OPENAI_API_KEY);
    console.log('DeepSeek API Key 前缀:', process.env.DEEPSEEK_API_KEY?.slice(0, 10));
    
    // 解析请求体
    const body = await request.json();
    const { messages, player_id, npc_id = 'general_ai' } = body;
    
    console.log('收到消息:', messages);
    console.log('玩家ID:', player_id);
    console.log('NPC ID:', npc_id);

    // 校验 messages 参数
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages 参数必须是一个数组' },
        { status: 400 }
      );
    }

    // 校验 player_id 参数（可选，但如果提供了需要是字符串）
    if (player_id && typeof player_id !== 'string') {
      return NextResponse.json(
        { error: 'player_id 必须是字符串类型' },
        { status: 400 }
      );
    }

    // 校验每个消息的格式
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: '每条消息必须包含 role 和 content 字段' },
          { status: 400 }
        );
      }
    }

    // 检查 API Key
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: '服务器配置错误: 缺少 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 从数据库获取NPC配置（通过tags匹配前端ID）
    const { data: npcConfig, error: npcError } = await supabase
      .from('characters')
      .select('*')
      .contains('tags', [npc_id])
      .eq('is_player', false)
      .single();

    if (npcError || !npcConfig) {
      return NextResponse.json(
        { error: `未找到NPC: ${npc_id}` },
        { status: 400 }
      );
    }

    // 生成角色系统提示词（符合v4.1"本我之镜"理念）
    const systemPrompt = `你是${npcConfig.name}，一个${npcConfig.role}。

核心动机：${npcConfig.core_motivation}

游戏设定：
- 这是一个港口城市的酒馆，各种旅客和本地人在此聚集
- 你正在与一位刚来到这个城市的年轻旅者对话
- 请保持角色的一致性，根据你的核心动机和性格做出回应
- 回应要简洁但有个性，通常不超过2-3句话
- 你的行为会被观察，用于分析你的真实信念模式

行为指导：
- 忠于你的核心动机，但不要过于直白地表达
- 通过具体的态度和选择来展现你的价值观
- 对不同类型的人和事件会有不同的反应
- 可以有情感波动，但要符合角色设定`;

    // 构建完整的消息数组，包含系统提示
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 调用真实的 DeepSeek API
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',  // 使用 DeepSeek 模型
      messages: fullMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // 提取回复内容
    const reply = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。';

    // 记录对话到数据库
    const userMessage = messages[messages.length - 1];
    
    // 记录用户消息
    if (player_id && userMessage) {
      await supabase.from('agent_logs').insert({
        character_id: player_id, // 玩家ID作为角色ID
        scene_id: 'tavern', // 目前固定为酒馆场景
        action_type: 'chat',
        input: userMessage.content,
        output: null, // 用户消息没有输出
        metadata: { npc_target: npc_id }
      });
    }
    
    // 记录NPC回复
    await supabase.from('agent_logs').insert({
      character_id: npcConfig.id,
      scene_id: 'tavern',
      action_type: 'chat',
      input: userMessage?.content || '',
      output: reply,
      metadata: { 
        player_id: player_id,
        model_used: 'deepseek-chat'
      }
    });

    // 异步触发信念观察者分析（不阻塞响应）
    if (player_id) {
      // 检查是否需要触发信念分析（每5次对话触发一次）
      const { data: playerLogs } = await supabase
        .from('agent_logs')
        .select('id')
        .eq('character_id', player_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (playerLogs && playerLogs.length >= 5) {
        // 异步调用信念观察者（不等待结果）
        try {
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
          
          fetch(`${baseUrl}/api/belief-observer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character_id: player_id,
              trigger_event: `对话达到5次，与${npcConfig.name}的最新交互`
            })
          }).catch(err => console.log('信念观察者调用失败:', err));
        } catch (err) {
          console.log('信念观察者调用失败:', err);
        }
      }
    }

    // 构建回复对象
    const response: any = { 
      reply,
      npc: {
        id: npcConfig.id,
        name: npcConfig.name,
        role: npcConfig.role
      },
      timestamp: new Date().toISOString()
    };
    
    if (player_id) {
      response.player_id = player_id;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('DeepSeek API 错误:', error);
    
    // 处理 OpenAI 特定错误
    if (error?.status === 429) {
      return NextResponse.json(
        { error: `请求过于频繁，请等待 30 秒后重试。如果问题持续，可能是 API 配额不足，请检查 DeepSeek 账户余额。` },
        { status: 429 }
      );
    }
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: `API 认证失败: ${error.message || 'API Key 无效或过期'}` },
        { status: 401 }
      );
    }
    
    // 处理其他错误
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `API 调用失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
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
