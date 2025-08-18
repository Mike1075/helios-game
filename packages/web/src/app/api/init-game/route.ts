import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { playerName } = await request.json();
    
    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // 生成会话ID
    const sessionId = uuidv4();
    
    // TODO: 这里应该调用Zep API初始化会话
    // 目前先返回mock数据
    console.log(`🎮 初始化游戏会话: ${playerName} -> ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      sessionId,
      playerName,
      message: '游戏会话初始化成功'
    });
    
  } catch (error) {
    console.error('❌ 初始化游戏失败:', error);
    return NextResponse.json(
      { error: 'Failed to initialize game session' },
      { status: 500 }
    );
  }
}