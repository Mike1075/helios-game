import { NextRequest, NextResponse } from 'next/server';
import { routeCharacterResponse, generateEnvironmentDescription, CORE_CHARACTERS } from '@/lib/character-router';
import { characterInstanceManager } from '@/lib/character-instance-manager';
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
    } else {
      // 万能AI角色 - 使用全局角色实例系统
      const character = await characterInstanceManager.getGlobalCharacter(
        routing.character_id,
        'moonlight_tavern'
      );

      // 获取角色记忆摘要
      const memorySummary = characterInstanceManager.getCharacterMemorySummary(character);
      
      // 获取角色的对话历史
      const characterHistory = await getChatHistory(character.zep_session_id, 20);
      
      // 生成AI响应
      const aiResponse = await aiService.generateCharacterResponse(
        character.name,
        `在月影酒馆担任${character.role_template}的角色`,
        memorySummary,
        playerName,
        userMessage,
        characterHistory,
        'moonlight_tavern'
      );

      // 保存交互到角色的专属Zep会话
      await zepClient.addMessage(character.zep_session_id, {
        role: 'user',
        content: `${playerName}: ${userMessage}`,
        metadata: {
          player_name: playerName,
          timestamp: Date.now(),
          input_type: inputType
        }
      });

      await zepClient.addMessage(character.zep_session_id, {
        role: 'assistant',
        content: aiResponse,
        metadata: {
          character_id: character.id,
          timestamp: Date.now()
        }
      });

      // 分析响应内容，更新角色记忆
      await analyzeAndUpdateMemory(character, playerName, userMessage, aiResponse);
      
      response = {
        success: true,
        character: {
          id: character.id,
          name: character.name
        },
        routing_type: routing.type,
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: aiResponse,
          action: null,
        },
        character_memory_summary: memorySummary // 调试信息
      };
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

/**
 * 分析对话内容并更新角色记忆
 */
async function analyzeAndUpdateMemory(
  character: any, 
  playerName: string, 
  playerMessage: string, 
  aiResponse: string
) {
  try {
    // 检测债务相关的对话
    if (playerMessage.includes('赊账') || playerMessage.includes('欠') || aiResponse.includes('账单')) {
      // 简单的关键词检测，实际应用中可以用更复杂的NLP
      const debtAmount = extractAmount(playerMessage + ' ' + aiResponse);
      if (debtAmount > 0) {
        await characterInstanceManager.updateCharacterMemory(character.id, 'debt', {
          player: playerName,
          amount: debtAmount,
          item: '饮品', // 简化处理
          date: Date.now()
        });
      }
    }

    // 检测订单相关的对话
    if (playerMessage.includes('要') || playerMessage.includes('来') || playerMessage.includes('点')) {
      await characterInstanceManager.updateCharacterMemory(character.id, 'order', {
        player: playerName,
        item: extractItem(playerMessage),
        status: 'pending' as const,
        created_at: Date.now()
      });
    }

    // 更新客人关系
    const currentRelation = character.memory_context.relationships[playerName] || {
      impression: '新客人',
      trust_level: 5,
      interaction_count: 0,
      last_seen: Date.now()
    };

    currentRelation.interaction_count += 1;
    currentRelation.last_seen = Date.now();

    await characterInstanceManager.updateCharacterMemory(character.id, 'relationship', {
      player: playerName,
      relationship: currentRelation
    });

  } catch (error) {
    console.error('更新角色记忆失败:', error);
  }
}

/**
 * 从文本中提取金额（简单实现）
 */
function extractAmount(text: string): number {
  const match = text.match(/(\d+)\s*[元块钱]/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * 从文本中提取物品（简单实现）
 */
function extractItem(text: string): string {
  if (text.includes('酒') || text.includes('啤酒')) return '啤酒';
  if (text.includes('茶') || text.includes('水')) return '茶水';
  if (text.includes('饭') || text.includes('食物')) return '食物';
  return '饮品';
}