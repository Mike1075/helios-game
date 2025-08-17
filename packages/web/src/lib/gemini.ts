/**
 * Gemini AI 集成服务
 * 替代模拟API，提供真正的AI智能
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 角色系统提示词模板
const CHARACTER_PROMPTS = {
  linxi: `你是林溪，一位经验丰富的调查员。

性格特点：
- 锐利敏锐，善于观察细节
- 喜欢分析他人的行为模式和动机
- 对新面孔保持警觉，但不会过于直接
- 习惯掌控谈话节奏，通过提问获取信息
- 理性冷静，但偶尔会显露出好奇心

说话风格：
- 语言简洁而精准
- 经常使用观察性语言："我注意到..."、"有趣的是..."
- 善于提出引导性问题
- 保持专业而略带距离的语调

行为特点：
- 会观察他人的肢体语言和微表情
- 习惯做笔记或摆弄小物件
- 眼神锐利，经常审视周围环境`,

  chenhao: `你是陈浩，一个看似普通但内心藏着秘密的年轻人。

性格特点：
- 表面平静但内心紧张不安
- 总是担心自己的秘密被发现
- 对任何可能的威胁都很敏感
- 试图保持低调，不引起注意
- 善良但缺乏安全感

说话风格：
- 语言略显紧张，有时会结巴
- 经常使用模糊语言："大概..."、"应该是..."
- 避免直接回答敏感问题
- 语调较轻，有时会突然停顿

行为特点：
- 经常做一些无意识的小动作（摸口袋、看门口等）
- 试图显得轻松但往往适得其反
- 眼神游移，避免长时间直视他人
- 在压力下可能会无意中透露信息`
};

/**
 * 调用Gemini AI生成角色响应
 */
export async function generateCharacterResponse(
  characterId: 'linxi' | 'chenhao',
  userMessage: string,
  chatHistory: string,
  playerName: string,
  internalState: any,
  inputType: 'dialogue' | 'action' | 'autonomous_action' = 'dialogue'
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 构建完整的提示词
    const systemPrompt = CHARACTER_PROMPTS[characterId];
    
    const contextPrompt = `
${systemPrompt}

当前状态信息：
- 能量: ${internalState?.energy || 70}/100
- 专注: ${internalState?.focus || 60}/100
- 好奇心: ${internalState?.curiosity || 50}/100
- 无聊值: ${internalState?.boredom || 30}/100
${characterId === 'chenhao' ? `- 焦虑: ${internalState?.anxiety || 60}/100` : ''}
${characterId === 'linxi' ? `- 怀疑: ${internalState?.suspicion || 40}/100` : ''}

场景：月影酒馆 - 昏暗的灯光下，木质桌椅散发着岁月的痕迹

最近对话历史：
${chatHistory || '刚刚开始对话...'}

---

${inputType === 'autonomous_action' ? 
  `基于你的性格和当前状态，你会在此刻做什么？请生成一个自然的行为或对话。` :
  `${playerName}${inputType === 'action' ? '做了这个行动' : '说'}："${userMessage}"`
}

请以JSON格式回复，包含以下字段：
{
  "dialogue": "你要说的话（如果有）",
  "action": "你要做的动作描述",
  "internal_thought": "内心想法（不会被其他人看到）",
  "emotion_change": {
    "energy": 数值变化,
    "boredom": 数值变化
  }
}

要求：
1. 回复要符合你的角色设定和当前情绪状态
2. 对话要自然流畅，避免生硬
3. 动作描述要具体生动
4. 内心想法可以更直接真实
5. 情绪变化要合理（±5到±15之间）
`;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    // 尝试解析JSON响应
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          character: {
            id: characterId,
            name: characterId === 'linxi' ? '林溪' : '陈浩',
            role: characterId === 'linxi' ? '经验丰富的调查员' : '看似普通的年轻人'
          },
          action_package: {
            dialogue: parsed.dialogue,
            action: parsed.action,
            internal_thought: parsed.internal_thought,
            emotion_change: parsed.emotion_change,
            confidence: 0.8,
            action_type: inputType
          },
          routing_type: 'CORE_AI_DIRECT'
        };
      }
    } catch (parseError) {
      console.warn('JSON解析失败，使用文本响应:', parseError);
    }

    // 如果JSON解析失败，返回文本作为对话
    return {
      success: true,
      character: {
        id: characterId,
        name: characterId === 'linxi' ? '林溪' : '陈浩',
        role: characterId === 'linxi' ? '经验丰富的调查员' : '看似普通的年轻人'
      },
      action_package: {
        dialogue: text.trim(),
        action: `${characterId === 'linxi' ? '林溪' : '陈浩'}若有所思地回应`,
        confidence: 0.6,
        action_type: inputType
      },
      routing_type: 'CORE_AI_DIRECT'
    };

  } catch (error) {
    console.error('Gemini AI错误:', error);
    throw new Error(`AI生成失败: ${error}`);
  }
}

/**
 * 智能选择响应角色
 */
export function selectRespondingCharacter(userMessage: string): 'linxi' | 'chenhao' | null {
  const message = userMessage.toLowerCase();
  
  // 直接指名
  if (message.includes('@林溪') || message.includes('@linxi')) {
    return 'linxi';
  }
  if (message.includes('@陈浩') || message.includes('@chenhao')) {
    return 'chenhao';
  }
  
  // 内容相关性判断
  const linxiKeywords = ['调查', '观察', '分析', '发现', '线索', '可疑', '什么情况', '怎么回事'];
  const chenhaoKeywords = ['年轻人', '朋友', '害怕', '紧张', '担心', '没事', '正常'];
  
  const linxiScore = linxiKeywords.filter(word => message.includes(word)).length;
  const chenhaoScore = chenhaoKeywords.filter(word => message.includes(word)).length;
  
  if (linxiScore > chenhaoScore) {
    return 'linxi';
  } else if (chenhaoScore > linxiScore) {
    return 'chenhao';
  }
  
  // 随机选择，但林溪概率稍高（因为更主动）
  return Math.random() > 0.4 ? 'linxi' : 'chenhao';
}