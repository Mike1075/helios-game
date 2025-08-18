import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, playerName, sessionId, inputType } = await request.json();
    
    console.log(`💬 收到${inputType}消息:`, {
      playerName,
      sessionId,
      message: userMessage
    });
    
    // TODO: 这里应该调用完整的AI处理流程
    // 1. 保存到Zep
    // 2. 调用万能AI系统
    // 3. 返回AI响应
    
    // 目前返回mock响应
    const mockResponse = {
      success: true,
      character: {
        id: 'tavern_keeper',
        name: '老板'
      },
      routing_type: 'universal_ai',
      action_package: {
        dialogue: `欢迎来到月影酒馆，${playerName}！我是这里的老板。今天想要点什么？`,
        action: '老板友善地擦拭着酒杯，眼神中带着职业的热情。',
        // 注意：internal_thought不返回给前端
      }
    };
    
    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error('❌ 聊天处理失败:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}