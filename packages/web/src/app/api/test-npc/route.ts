import { NextResponse } from 'next/server';

// 简单测试端点来验证NPC自主对话功能
export async function GET() {
  console.log('Test NPC endpoint called');
  
  return NextResponse.json({
    message: 'NPC test endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      hasAIKey: !!process.env.AI_GATEWAY_API_KEY,
      keyLength: process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_API_KEY.length : 0
    }
  });
}

export async function POST() {
  console.log('Testing NPC auto chat functionality...');
  
  try {
    // 模拟调用NPC chat API
    const response = await fetch('/api/npc-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationHistory: [
          { role: 'user', content: '大家好' },
          { role: 'assistant', content: '你好！', character: 'alex' }
        ],
        timeOfDay: 'evening',
        barActivity: 'quiet'
      }),
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      testResult: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('NPC test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}