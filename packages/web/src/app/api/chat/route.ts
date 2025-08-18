import { NextRequest, NextResponse } from 'next/server';
import { routeCharacterResponse, generateEnvironmentDescription, CORE_CHARACTERS } from '@/lib/character-router';
import { aiService } from '@/lib/ai-service';
import { zepClient, getChatHistory, savePlayerMessage, saveAIResponse } from '@/lib/zep';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, playerName, sessionId, inputType } = await request.json();
    
    console.log(`💬 收到${inputType}消息:`, {
      playerName,
      sessionId,
      message: userMessage
    });
    
    // 1. 智能路由分析
    const routing = routeCharacterResponse(userMessage, playerName);
    console.log('🎯 路由结果:', routing);
    
    // 2. 保存玩家消息到Zep
    await savePlayerMessage(sessionId, playerName, userMessage, inputType === 'action' ? 'action' : 'dialogue');
    
    // 3. 根据路由类型生成响应
    let response;
    
    if (routing.type === 'environment') {
      // 环境描述
      const environmentDesc = generateEnvironmentDescription(userMessage);
      response = {
        success: true,
        character: {
          id: 'environment',
          name: '环境'
        },
        routing_type: 'environment',
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: null,
          action: environmentDesc,
        }
      };
    } else if (routing.type === 'core_ai') {
      // 核心AI角色（林溪、陈浩）
      const coreCharacter = CORE_CHARACTERS.find(c => c.id === routing.character_id);
      if (!coreCharacter) {
        throw new Error(`未找到核心角色: ${routing.character_id}`);
      }

      // 获取对话历史
      const conversationHistory = await getChatHistory(sessionId, 10);
      
      // 生成AI响应
      const aiResponse = await aiService.generateCharacterResponse(
        coreCharacter.name,
        `${coreCharacter.role}，${coreCharacter.personality}`,
        '', // 核心角色暂时不使用复杂记忆系统
        playerName,
        userMessage,
        conversationHistory,
        'moonlight_tavern'
      );

      // 保存AI响应到Zep
      await saveAIResponse(sessionId, routing.character_id, aiResponse);
      
      response = {
        success: true,
        character: {
          id: routing.character_id,
          name: routing.character_name
        },
        routing_type: routing.type,
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: aiResponse,
          action: null,
        }
      };
    } else if (routing.type === 'general_ai') {
      // 智能通用AI - 根据用户需求智能响应
      
      // 获取对话历史
      const conversationHistory = await getChatHistory(sessionId, 10);
      
      // 使用智能通用AI系统提示词
      const systemPrompt = `你是月影酒馆的智能环境，能够根据客人的需求和情况，智能地以合适的身份回应。

场景：月影酒馆 - 一个神秘而温馨的酒馆，有着昏暗的灯光和木质的桌椅

你的能力：
- 能够根据客人的问题和需求，智能地决定以什么身份回应（店主、服务员、当地人、过路人等）
- 对酒馆的设施、服务、当地情况都很了解
- 友善、智能、适应性强

最近的对话历史：
${conversationHistory}

回应要求：
- 根据客人的具体需求，选择最合适的身份来回应
- 只返回对话内容，不要包含动作描述或身份说明
- 回应要自然、有用、符合酒馆氛围
- 对于一般性问题（如厕所位置、饮食、住宿等），直接提供帮助

现在，${playerName}对你说："${userMessage}"

请自然地回应：`;

      // 直接使用AI服务生成响应
      const aiResponse = await aiService.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      // 保存AI响应到Zep
      await saveAIResponse(sessionId, 'general', aiResponse.content);
      
      response = {
        success: true,
        character: {
          id: 'general',
          name: '月影酒馆'
        },
        routing_type: routing.type,
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: aiResponse.content,
          action: null,
        }
      };
    } else {
      // 备用：不应该到达这里
      throw new Error(`未知的路由类型: ${routing.type}`);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ 聊天处理失败:', error);
    return NextResponse.json(
      { error: `聊天处理失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}

