/**
 * Next.js API路由 - /api/chat
 * 
 * 模拟Mike的AI API，用于本地测试
 * 在实际部署中，会被Mike的Vercel云API替代
 */

import { NextRequest, NextResponse } from 'next/server';

// 简单的角色响应模板
const characterResponses = {
  linxi: {
    dialogue: [
      "有趣，{player_name}，你的表情告诉我你在思考什么。",
      "我注意到你刚才的反应。能告诉我你在想什么吗？",
      "作为调查员，我习惯观察每个人的细微表情。你看起来有心事。",
      "这个地方总是让人放松警惕。你是第一次来月影酒馆吗？",
      "你的举止很有趣。大多数人来这里都是为了躲避什么。"
    ],
    action: [
      "仔细观察{player_name}的面部表情和肢体语言",
      "轻轻转动手中的酒杯，眼神不离开对方",
      "靠在椅背上，做出放松的姿态，但眼神依然锐利",
      "从包里拿出一个小笔记本，若无其事地翻看",
      "扫视酒馆其他角落，然后将注意力重新放在对话上"
    ]
  },
  
  chenhao: {
    dialogue: [
      "啊，{player_name}，我...我只是路过这里。",
      "这里的酒还不错，你要不要试试？",
      "我经常来这里，这里很安静，适合...思考。",
      "你看起来面生，不是本地人吧？",
      "（小声）希望今晚不会有什么麻烦..."
    ],
    action: [
      "紧张地看了看四周，然后低头看着自己的酒杯",
      "不自觉地摸了摸口袋，仿佛确认什么东西还在",
      "试图显得轻松，但声音略微颤抖",
      "快速瞥了一眼酒馆门口，然后强迫自己看向{player_name}",
      "双手握着酒杯，指节因为用力而发白"
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, playerName, chatHistory, inputType, targetCharacter } = body;

    console.log('🤖 API调用:', { userMessage, playerName, inputType, targetCharacter });

    // 确定响应的角色
    let respondingCharacter = targetCharacter;
    
    // 如果没有指定角色，根据消息内容智能选择
    if (!respondingCharacter) {
      if (userMessage.includes('@林溪') || userMessage.includes('调查') || userMessage.includes('观察')) {
        respondingCharacter = 'linxi';
      } else if (userMessage.includes('@陈浩') || userMessage.includes('年轻人')) {
        respondingCharacter = 'chenhao';
      } else {
        // 随机选择一个角色响应
        respondingCharacter = Math.random() > 0.6 ? 'linxi' : 'chenhao';
      }
    }

    // 生成响应
    const character = respondingCharacter === 'linxi' ? {
      id: 'linxi',
      name: '林溪',
      role: '经验丰富的调查员'
    } : {
      id: 'chenhao', 
      name: '陈浩',
      role: '看似普通的年轻人'
    };

    const responses = characterResponses[respondingCharacter as keyof typeof characterResponses];
    
    // 随机选择对话和行动
    const dialogue = responses.dialogue[Math.floor(Math.random() * responses.dialogue.length)]
      .replace('{player_name}', playerName);
    
    const action = responses.action[Math.floor(Math.random() * responses.action.length)]
      .replace('{player_name}', playerName);

    const actionPackage = {
      dialogue: inputType === 'dialogue' ? dialogue : undefined,
      action: inputType === 'action' ? action : action,
      internal_thought: `${character.name}心想：这个${playerName}很有趣...`,
      confidence: 0.7 + Math.random() * 0.2,
      action_type: inputType || 'dialogue'
    };

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return NextResponse.json({
      success: true,
      character,
      action_package: actionPackage,
      routing_type: 'CORE_AI'
    });

  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      error: 'API调用失败'
    }, { status: 500 });
  }
}