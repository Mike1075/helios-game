/**
 * Next.js API路由 - /api/chat
 * 
 * 集成Gemini AI的真实智能对话系统
 * 提供林溪和陈浩两个AI角色的对话功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCharacterResponse, selectRespondingCharacter } from '../../../lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, playerName, chatHistory, inputType = 'dialogue', targetCharacter } = body;

    console.log('🤖 Gemini API调用:', { userMessage, playerName, inputType, targetCharacter });

    // 确定响应的角色
    let respondingCharacter = targetCharacter;
    
    // 如果没有指定角色，使用智能选择逻辑
    if (!respondingCharacter) {
      respondingCharacter = selectRespondingCharacter(userMessage);
      if (!respondingCharacter) {
        // 如果智能选择也没有结果，默认选择林溪
        respondingCharacter = 'linxi';
      }
    }

    // 构建内部状态（这里使用一些基础值，后续可以从数据库读取）
    const internalState = {
      energy: 60 + Math.floor(Math.random() * 30),
      focus: 50 + Math.floor(Math.random() * 40),
      curiosity: 40 + Math.floor(Math.random() * 40),
      boredom: 20 + Math.floor(Math.random() * 40),
      ...(respondingCharacter === 'chenhao' && { anxiety: 50 + Math.floor(Math.random() * 30) }),
      ...(respondingCharacter === 'linxi' && { suspicion: 30 + Math.floor(Math.random() * 40) })
    };

    // 调用Gemini AI生成响应
    const aiResponse = await generateCharacterResponse(
      respondingCharacter as 'linxi' | 'chenhao',
      userMessage,
      chatHistory || '',
      playerName,
      internalState,
      inputType as 'dialogue' | 'action' | 'autonomous_action'
    );

    if (!aiResponse.success) {
      throw new Error('AI生成失败');
    }

    console.log('✅ Gemini响应成功:', {
      character: aiResponse.character.name,
      dialogue: aiResponse.action_package.dialogue?.substring(0, 50) + '...',
      routing: aiResponse.routing_type
    });

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('❌ Gemini API错误:', error);
    
    // 如果AI调用失败，返回简单的错误响应
    return NextResponse.json({
      success: false,
      error: `AI服务暂时不可用: ${error}`,
      character: {
        id: 'system',
        name: '系统',
        role: '系统消息'
      },
      action_package: {
        dialogue: '抱歉，AI服务暂时不可用，请稍后再试。',
        action: '系统显示错误信息',
        confidence: 0.1,
        action_type: 'dialogue'
      },
      routing_type: 'ERROR_FALLBACK'
    }, { status: 200 }); // 返回200而不是500，让前端可以正常处理
  }
}