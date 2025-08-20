import { NextRequest, NextResponse } from 'next/server';
import { routeCharacterResponse, generateEnvironmentDescription, CORE_CHARACTERS } from '@/lib/character-router';
import { aiService } from '@/lib/ai-service';
import { getChatHistory, savePlayerMessage, saveAIResponse } from '@/lib/zep';
import { memoryManager } from '@/lib/supabase-memory';
import { dynamicCharacterManager } from '@/lib/dynamic-character-manager';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { userMessage, playerName, sessionId, inputType } = await request.json();
    
    console.log(`💬 [${requestId}] 收到${inputType}消息:`, {
      playerName,
      sessionId,
      message: userMessage,
      timestamp: new Date().toISOString()
    });

    // 检查环境变量
    const hasAIKey = !!process.env.AI_GATEWAY_API_KEY;
    console.log('🔑 环境变量检查:', { hasAIKey });

    if (!hasAIKey) {
      console.error('❌ Vercel AI Gateway API Key 缺失!', {
        AI_GATEWAY_API_KEY: hasAIKey ? '✅存在' : '❌缺失'
      });
      return NextResponse.json(
        { 
          error: 'Vercel AI Gateway API Key 未配置',
          details: {
            AI_GATEWAY_API_KEY: hasAIKey ? '已配置' : '缺失',
            message: '请在 Vercel 仪表板中创建 AI Gateway API Key 并设置到环境变量中'
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ [${requestId}] 环境变量检查通过，开始AI调用`);
    
    // 1. 获取现有动态角色信息
    const existingDynamicCharacters = dynamicCharacterManager.getActiveCharacters().map(char => char.name);
    
    // 2. 智能路由分析
    const routing = routeCharacterResponse(userMessage, playerName, existingDynamicCharacters);
    console.log(`🎯 [${requestId}] 路由结果:`, routing);
    
    // 3. 保存玩家消息到Zep (异步，不阻塞主流程)
    savePlayerMessage(sessionId, playerName, userMessage, inputType === 'action' ? 'action' : 'dialogue')
      .catch(error => console.warn('Zep保存玩家消息失败，但不影响聊天:', error.message));
    
    // 通用AI处理函数
    async function handleGeneralAI() {
      // 获取对话历史（允许失败）
      const conversationHistory = await getChatHistory(sessionId, 10).catch(() => '对话刚刚开始...');
      
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
- 如果不知道客人姓名，可以礼貌地询问如何称呼

现在，有位客人对你说："${userMessage}"

请自然地回应：`;

      // 直接使用AI服务生成响应
      console.log('🤖 调用AI服务，模型:', 'alibaba/qwen-3-235b');
      const aiResponse = await aiService.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);
      console.log('✅ AI调用成功，响应长度:', aiResponse.content.length);

      // 保存AI响应到Zep (异步，不阻塞)
      saveAIResponse(sessionId, 'general', aiResponse.content)
        .catch(error => console.warn('Zep保存AI响应失败:', error.message));
      
      return {
        success: true,
        character: {
          id: 'general',
          name: '月影酒馆'
        },
        routing_type: 'general_ai',
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: aiResponse.content,
          action: null,
        }
      };
    }
    
    // 4. 根据路由类型生成响应
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

      // 获取对话历史（允许失败）
      const conversationHistory = await getChatHistory(sessionId, 10).catch(() => '对话刚刚开始...');
      
      // 生成AI响应
      console.log(`🤖 调用核心AI角色: ${coreCharacter.name}`);
      const aiResponse = await aiService.generateCharacterResponse(
        coreCharacter.name,
        `${coreCharacter.role}，${coreCharacter.personality}`,
        '', // 核心角色暂时不使用复杂记忆系统
        playerName,
        userMessage,
        conversationHistory,
        'moonlight_tavern'
      );
      console.log(`✅ ${coreCharacter.name}响应成功，长度:`, aiResponse.length);

      // 保存AI响应到Zep (异步，不阻塞)
      saveAIResponse(sessionId, routing.character_id, aiResponse)
        .catch(error => console.warn('Zep保存AI响应失败:', error.message));
      
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
    } else if (routing.type === 'dynamic_ai') {
      // 动态角色创建和响应
      
      if (routing.needsNewCharacter && routing.characterType) {
        let newCharacter;
        
        if (routing.characterType === 'ai_analyze') {
          // 使用AI智能分析来创建最合适的角色
          newCharacter = await dynamicCharacterManager.createCharacterByAnalysis({
            userMessage,
            sceneId: 'moonlight_tavern',
            existingCharacters: existingDynamicCharacters,
            playerName
          });
        } else {
          // 创建指定类型的角色
          newCharacter = await dynamicCharacterManager.createCharacterForContext({
            userMessage,
            sceneId: 'moonlight_tavern',
            existingCharacters: existingDynamicCharacters,
            playerName
          }, routing.characterType);
        }

        if (newCharacter) {
          // 获取对话历史（允许失败）
          const conversationHistory = await getChatHistory(sessionId, 10).catch(() => '对话刚刚开始...');
          
          // 生成新角色的响应
          const aiResponse = await dynamicCharacterManager.generateCharacterResponse(
            newCharacter,
            playerName,
            userMessage
          );

          // 保存AI响应到Zep（使用角色专属会话，异步不阻塞）
          saveAIResponse(newCharacter.supabase_session_id, newCharacter.id, aiResponse)
            .catch(error => console.warn('Zep保存新角色响应失败:', error.message));
          
          // 发送新角色创建事件到客户端
          console.log('📢 发送新角色创建广播事件');
          
          response = {
            success: true,
            character: {
              id: newCharacter.id,
              name: newCharacter.name
            },
            routing_type: routing.type,
            routing_reasoning: routing.reasoning,
            action_package: {
              dialogue: aiResponse,
              action: null,
            },
            new_character_created: true,
            character_info: {
              role: newCharacter.role,
              personality: newCharacter.personality,
              background: newCharacter.background,
              appearance: newCharacter.appearance
            },
            // 添加事件广播数据
            character_event: {
              id: newCharacter.id,
              name: newCharacter.name,
              role: newCharacter.role,
              type: 'dynamic_npc'
            }
          };
        } else {
          // 角色创建失败，fallback到通用AI
          response = await handleGeneralAI();
        }
      } else {
        // 不应该到达这里
        throw new Error('动态角色路由配置错误');
      }
    } else if (routing.type === 'general_ai') {
      response = await handleGeneralAI();
    } else {
      // 备用：不应该到达这里
      throw new Error(`未知的路由类型: ${routing.type}`);
    }
    
    const endTime = Date.now();
    console.log(`✅ [${requestId}] 聊天处理完成, 耗时: ${endTime - startTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ [${requestId}] 聊天处理失败 (耗时: ${endTime - startTime}ms):`, error);
    
    // 提供优雅的fallback响应
    const fallbackResponse = {
      success: true,
      character: {
        id: 'system',
        name: '系统'
      },
      routing_type: 'fallback',
      routing_reasoning: '系统暂时不可用，提供基础回应',
      action_package: {
        dialogue: '抱歉，我需要一点时间整理思绪。请稍后再试，或者换个话题。',
        action: null,
      }
    };
    
    // 如果是严重错误，返回错误状态；否则返回fallback
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(fallbackResponse);
    }
    
    return NextResponse.json(
      { error: `聊天处理失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}

