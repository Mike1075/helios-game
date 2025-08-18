import { NextRequest, NextResponse } from 'next/server';
import { routeCharacterResponse, generateEnvironmentDescription, getCharacterSystemPrompt } from '@/lib/character-router';

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
    
    // 2. 根据路由类型生成响应
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
    } else {
      // AI角色响应
      const systemPrompt = getCharacterSystemPrompt(routing.character_id, routing.character_name);
      
      // TODO: 这里应该调用真实的AI API
      // 目前返回基于角色的mock响应
      let mockDialogue = '';
      
      if (routing.character_id === 'linxi') {
        mockDialogue = `${playerName}，我注意到你的举动。作为调查员，我对细节很敏感。有什么我可以帮你分析的吗？`;
      } else if (routing.character_id === 'chenhao') {
        mockDialogue = `呃...你好，${playerName}。我...我只是在这里安静地喝酒。没什么特别的...`;
      } else if (routing.character_id === 'tavern_keeper') {
        mockDialogue = `欢迎来到月影酒馆，${playerName}！我是这里的老板。今天想要点什么？`;
      } else if (routing.character_id === 'cook') {
        mockDialogue = `要吃的？今天有炖肉和面包，都是新鲜的。别的别指望了。`;
      } else if (routing.character_id === 'bartender') {
        mockDialogue = `需要喝点什么吗？我这里有各种酒，从啤酒到烈酒都有。`;
      } else {
        mockDialogue = `你好，${playerName}。我是${routing.character_name}。`;
      }
      
      response = {
        success: true,
        character: {
          id: routing.character_id,
          name: routing.character_name
        },
        routing_type: routing.type,
        routing_reasoning: routing.reasoning,
        action_package: {
          dialogue: mockDialogue,
          action: null, // 暂时不生成行动描述
        }
      };
    }
    
    // TODO: 3. 保存到Zep
    // TODO: 4. 保存到Supabase
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ 聊天处理失败:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}