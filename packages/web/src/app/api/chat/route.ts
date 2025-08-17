/**
 * Next.js API路由 - /api/chat
 * 
 * 集成Gemini AI的真实智能对话系统
 * 提供林溪和陈浩两个AI角色的对话功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCharacterResponse, generateUniversalAIResponse, selectRespondingCharacter } from '../../../lib/gemini';

// Zep相关函数（服务器端）
async function saveMessageToZep(sessionId: string, playerName: string, message: string, isAI = false, characterId?: string) {
  try {
    const ZEP_API_KEY = process.env.ZEP_API_KEY;
    const ZEP_ENDPOINT = process.env.ZEP_ENDPOINT || 'https://api.getzep.com';

    if (!ZEP_API_KEY) {
      console.warn('⚠️ ZEP_API_KEY未配置，跳过Zep保存');
      return { success: false };
    }

    const zepMessage = {
      role: isAI ? 'assistant' : 'user',
      content: message,
      metadata: {
        character_id: characterId || (isAI ? 'ai' : 'player'),
        player_name: playerName,
        timestamp: Date.now(),
      }
    };

    const response = await fetch(`${ZEP_ENDPOINT}/api/v1/sessions/${sessionId}/memory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [zepMessage] }),
    });

    return { success: response.ok };
  } catch (error) {
    console.error('❌ Zep保存失败:', error);
    return { success: false };
  }
}

async function getChatHistoryFromZep(sessionId: string) {
  try {
    const ZEP_API_KEY = process.env.ZEP_API_KEY;
    const ZEP_ENDPOINT = process.env.ZEP_ENDPOINT || 'https://api.getzep.com';

    if (!ZEP_API_KEY) {
      return '对话刚刚开始...';
    }

    const response = await fetch(`${ZEP_ENDPOINT}/api/v1/sessions/${sessionId}/memory?limit=10`, {
      headers: {
        'Authorization': `Bearer ${ZEP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const messages = data.messages || [];
      
      if (messages.length === 0) return '对话刚刚开始...';
      
      return messages
        .slice(-10)
        .map((msg: any) => {
          const speaker = msg.metadata?.character_id === 'player' 
            ? msg.metadata?.player_name || '玩家'
            : msg.metadata?.character_id === 'linxi' 
              ? '林溪' 
              : msg.metadata?.character_id === 'chenhao'
                ? '陈浩'
                : '未知';
          
          return `${speaker}: ${msg.content}`;
        })
        .join('\n');
    }
    
    return '对话刚刚开始...';
  } catch (error) {
    console.error('❌ 获取Zep历史失败:', error);
    return '对话刚刚开始...';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, playerName, sessionId, inputType = 'dialogue', targetCharacter } = body;

    console.log('🤖 Gemini API调用:', { userMessage, playerName, inputType, targetCharacter });

    // 保存用户消息到Zep
    if (sessionId) {
      await saveMessageToZep(sessionId, playerName, userMessage, false, 'player');
    }

    // 获取对话历史
    const chatHistory = sessionId ? await getChatHistoryFromZep(sessionId) : '对话刚刚开始...';

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

    let aiResponse;

    // 判断是核心AI还是万能AI
    if (respondingCharacter === 'linxi' || respondingCharacter === 'chenhao') {
      // 核心AI角色路由
      console.log(`🧠 路由到核心AI: ${respondingCharacter}`);
      
      // 构建内部状态（这里使用一些基础值，后续可以从数据库读取）
      const internalState = {
        energy: 60 + Math.floor(Math.random() * 30),
        focus: 50 + Math.floor(Math.random() * 40),
        curiosity: 40 + Math.floor(Math.random() * 40),
        boredom: 20 + Math.floor(Math.random() * 40),
        ...(respondingCharacter === 'chenhao' && { anxiety: 50 + Math.floor(Math.random() * 30) }),
        ...(respondingCharacter === 'linxi' && { suspicion: 30 + Math.floor(Math.random() * 40) })
      };

      // 调用核心AI生成响应
      aiResponse = await generateCharacterResponse(
        respondingCharacter as 'linxi' | 'chenhao',
        userMessage,
        chatHistory,
        playerName,
        internalState,
        inputType as 'dialogue' | 'action' | 'autonomous_action'
      );
    } else {
      // 万能AI角色路由
      console.log(`🎭 路由到万能AI: ${respondingCharacter}`);
      
      // 调用万能AI生成响应
      aiResponse = await generateUniversalAIResponse(
        respondingCharacter,
        userMessage,
        chatHistory,
        playerName,
        inputType as 'dialogue' | 'action' | 'autonomous_action'
      );
    }

    if (!aiResponse.success) {
      throw new Error('AI生成失败');
    }

    // 保存AI响应到Zep
    if (sessionId && aiResponse.action_package.dialogue) {
      await saveMessageToZep(
        sessionId, 
        playerName, 
        aiResponse.action_package.dialogue, 
        true, 
        aiResponse.character.id
      );
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