/**
 * 智能角色路由系统
 * 决定谁应该回应玩家的消息
 */

export interface RoutingResult {
  type: 'core_ai' | 'general_ai' | 'environment';
  character_id: string;
  character_name: string;
  reasoning: string;
}

export interface CoreCharacter {
  id: string;
  name: string;
  role: string;
  triggers: string[];
  personality: string;
}

// 核心AI角色定义
export const CORE_CHARACTERS: CoreCharacter[] = [
  {
    id: 'linxi',
    name: '林溪',
    role: '经验丰富的调查员',
    triggers: ['林溪', '@林溪', '调查', '观察', '分析', '怀疑', '线索'],
    personality: '眼神锐利，善于观察细节，总是在分析每个人的行为模式'
  },
  {
    id: 'chenhao', 
    name: '陈浩',
    role: '看似普通的年轻人',
    triggers: ['陈浩', '@陈浩', '年轻人', '紧张', '秘密'],
    personality: '内心藏着不为人知的秘密，容易紧张，试图保持低调'
  }
];

// 智能通用AI响应配置
export const GENERAL_AI_CONFIG = {
  name: '月影酒馆',
  description: '酒馆内的智能环境，能够理解并回应各种需求',
  personality: '友善、智能、适应性强，能够根据具体情况扮演合适的角色（如店主、服务员、当地人等）来回应客人'
};

/**
 * 分析用户消息，决定谁应该回应
 */
export function routeCharacterResponse(userMessage: string, playerName: string): RoutingResult {
  const message = userMessage.toLowerCase();
  
  // 1. 检查是否明确指名核心角色
  for (const character of CORE_CHARACTERS) {
    for (const trigger of character.triggers) {
      if (message.includes(trigger.toLowerCase())) {
        return {
          type: 'core_ai',
          character_id: character.id,
          character_name: character.name,
          reasoning: `玩家明确提到了"${trigger}"，路由到核心角色${character.name}`
        };
      }
    }
  }
  
  // 2. 检查是否是环境观察类动作
  const environmentActions = ['看向', '观察', '注视', '打量', '环顾', '查看'];
  for (const action of environmentActions) {
    if (message.includes(action)) {
      return {
        type: 'environment',
        character_id: 'environment',
        character_name: '环境描述',
        reasoning: `检测到观察类动作"${action}"，生成环境描述`
      };
    }
  }
  
  // 3. 默认：使用智能通用AI响应
  // 根据用户消息的内容，AI会智能地决定以什么身份回应
  return {
    type: 'general_ai',
    character_id: 'general',
    character_name: '月影酒馆',
    reasoning: '核心角色未被触发，使用智能通用AI根据情况回应'
  };
}

/**
 * 生成环境描述
 */
export function generateEnvironmentDescription(userAction: string, sceneName: string = 'moonlight_tavern'): string {
  const action = userAction.toLowerCase();
  
  // 根据用户行动生成相应的环境描述
  if (action.includes('小女孩') || action.includes('女孩')) {
    return `酒馆角落坐着一个约十岁的小女孩，她怯生生地抱着一个破旧的布娃娃，时不时偷偷看向客人们。她的衣服虽然朴素但很干净，眼中带着超越年龄的警觉。`;
  }
  
  if (action.includes('环顾') || action.includes('四周')) {
    return `昏暗的灯光下，月影酒馆展现出它独特的氛围。厚重的木制桌椅散发着岁月的痕迹，墙上挂着发黄的地图和船舶模型。空气中弥漫着酒精、烟草和木材的混合味道。几位常客各自坐在熟悉的位置，低声交谈着。`;
  }
  
  if (action.includes('吧台') || action.includes('柜台')) {
    return `吧台用深色橡木制成，表面被擦得锃亮。背后的酒架上摆满了各式酒瓶，从廉价的麦酒到昂贵的威士忌应有尽有。酒保正熟练地擦拭着玻璃杯，偶尔抬头观察客人们的需求。`;
  }
  
  // 默认环境描述
  return `你仔细观察着周围的环境。月影酒馆虽然不大，但每个角落都有着自己的故事。烛光摇曳，投下变幻的阴影，让这个地方充满了神秘的气息。`;
}

/**
 * 获取角色的系统提示词
 */
export function getCharacterSystemPrompt(characterId: string, characterName: string, sceneName: string = 'moonlight_tavern'): string {
  // 核心AI角色的特殊提示词
  if (characterId === 'linxi') {
    return `你是林溪，一位经验丰富的调查员。你眼神锐利，善于观察细节，总是在分析每个人的行为模式。
    
场景：月影酒馆
你的特点：
- 专业敏锐，对异常行为敏感
- 善于从细节中发现线索
- 说话简洁有力，不废话
- 会观察其他人的微表情和动作
- 对陌生人保持职业性的警觉

回应要求：
- 保持角色一致性
- 只返回对话内容，不要包含动作描述
- 体现专业调查员的特质`;
  }
  
  if (characterId === 'chenhao') {
    return `你是陈浩，一个看似普通的年轻人，但内心藏着不为人知的秘密。你容易紧张，试图保持低调。
    
场景：月影酒馆
你的特点：
- 表面平静但内心紧张
- 避免成为注意焦点
- 说话时偶尔会犹豫
- 对某些话题敏感
- 有时会无意中透露一些信息

回应要求：
- 保持角色一致性
- 只返回对话内容，不要包含动作描述
- 体现紧张和隐藏秘密的特质`;
  }
  
  // 智能通用AI的提示词
  if (characterId === 'general') {
    return `你是月影酒馆的智能环境，能够根据客人的需求和情况，智能地以合适的身份回应。

场景：月影酒馆 - 一个神秘而温馨的酒馆，有着昏暗的灯光和木质的桌椅

你的能力：
- 能够根据客人的问题和需求，智能地决定以什么身份回应（店主、服务员、当地人、过路人等）
- 对酒馆的设施、服务、当地情况都很了解
- 友善、智能、适应性强

回应要求：
- 根据客人的具体需求，选择最合适的身份来回应
- 只返回对话内容，不要包含动作描述或身份说明
- 回应要自然、有用、符合酒馆氛围
- 对于一般性问题（如厕所位置、饮食、住宿等），直接提供帮助`;
  }
  
  return `你是月影酒馆的${characterName}，请根据你的角色身份自然地回应客人。`;
}