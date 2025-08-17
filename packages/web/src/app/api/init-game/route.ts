/**
 * 游戏初始化API路由
 * 处理Zep会话创建和Supabase初始化
 */

import { NextRequest, NextResponse } from 'next/server';

// 生成会话ID
function generateSessionId(playerName: string): string {
  return `player_${playerName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`;
}

// 初始化Zep会话（服务器端）
async function initializeZepSession(sessionId: string, playerName: string) {
  try {
    const ZEP_API_KEY = process.env.ZEP_API_KEY;
    const ZEP_ENDPOINT = process.env.ZEP_ENDPOINT || 'https://api.getzep.com';

    if (!ZEP_API_KEY) {
      console.warn('⚠️ ZEP_API_KEY未配置，跳过Zep初始化');
      return { success: false, reason: 'ZEP_API_KEY未配置' };
    }

    const response = await fetch(`${ZEP_ENDPOINT}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: playerName,
        metadata: {
          game: 'helios-mirror-of-self',
          scene: 'moonlight-tavern',
          created_at: new Date().toISOString()
        }
      }),
    });

    if (response.ok) {
      console.log('✅ Zep会话创建成功:', sessionId);
      return { success: true };
    } else {
      console.warn('⚠️ Zep会话创建失败:', response.status, response.statusText);
      return { success: false, reason: `Zep API错误: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Zep初始化错误:', error);
    return { success: false, reason: 'Zep连接失败' };
  }
}

// 初始化Supabase数据（服务器端）
async function initializeSupabaseData(playerName: string, sessionId: string) {
  try {
    // 这里可以添加Supabase初始化逻辑
    // 比如创建玩家记录、初始化信念系统等
    console.log('📊 Supabase初始化准备就绪');
    return { success: true };
  } catch (error) {
    console.error('❌ Supabase初始化错误:', error);
    return { success: false, reason: 'Supabase连接失败' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerName } = await request.json();

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({
        success: false,
        error: '玩家名字不能为空'
      }, { status: 400 });
    }

    console.log('🎮 初始化游戏会话:', playerName);

    // 生成会话ID
    const sessionId = generateSessionId(playerName);

    // 初始化Zep会话
    const zepResult = await initializeZepSession(sessionId, playerName);
    
    // 初始化Supabase数据
    const supabaseResult = await initializeSupabaseData(playerName, sessionId);

    // 返回结果
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      services: {
        zep: zepResult,
        supabase: supabaseResult
      },
      message: '游戏会话初始化完成'
    });

  } catch (error) {
    console.error('❌ 游戏初始化错误:', error);
    return NextResponse.json({
      success: false,
      error: '游戏初始化失败'
    }, { status: 500 });
  }
}