/**
 * 智能角色路由系统
 * 决定谁应该回应玩家的消息
 */

export interface RoutingResult {
  type: 'core_ai' | 'universal_ai' | 'environment';
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

// 万能AI角色模板
export const UNIVERSAL_AI_ROLES = {
  tavern_keeper: {
    name: '老板',
    description: '酒馆老板，经验丰富，见多识广',
    triggers: ['老板', '买', '卖', '价格', '房间', '住宿', '账单', '生意'],
    personality: '实用主义，精明但公正，对客人友好但保持商业距离'
  },
  bartender: {
    name: '酒保', 
    description: '专业的酒保，熟悉各种酒类',
    triggers: ['酒保', '酒', '喝', '倒酒', '醉', '酒精', '饮料', '威士忌', '啤酒'],
    personality: '专业友善，是很好的倾听者，偶尔分享人生智慧'
  },
  cook: {
    name: '厨师',
    description: '酒馆厨师，专注料理，脾气暴躁但手艺精湛', 
    triggers: ['厨师', '饭', '菜', '食物', '饿', '烤', '炖', '料理', '美食'],
    personality: '直率坦诚，对料理充满热情，不喜欢被打扰但乐于分享美食'
  },
  local_resident: {
    name: '当地居民',
    description: '酒馆的常客，对当地情况很了解',
    triggers: ['居民', '当地', '这里', '消息', '传闻', '路人'],
    personality: '健谈友善，喜欢分享当地见闻和小道消息'
  },
  guard: {
    name: '守卫',
    description: '维护酒馆秩序的守卫',
    triggers: ['守卫', '警察', '安全', '秩序', '麻烦', '打架', '治安'],
    personality: '严肃负责，维护秩序，对可疑行为保持警觉'
  }
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
  
  // 3. 检查万能AI角色触发词
  for (const [roleId, role] of Object.entries(UNIVERSAL_AI_ROLES)) {
    for (const trigger of role.triggers) {
      if (message.includes(trigger.toLowerCase())) {
        return {
          type: 'universal_ai',
          character_id: roleId,
          character_name: role.name,
          reasoning: `检测到关键词"${trigger}"，路由到万能AI角色${role.name}`
        };
      }
    }
  }
  
  // 4. 默认：根据场景选择最合适的角色
  // 在酒馆场景中，默认由老板回应新客人
  return {
    type: 'universal_ai',
    character_id: 'tavern_keeper',
    character_name: '老板',
    reasoning: '默认场景回应，酒馆老板负责招待客人'
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
  
  // 万能AI角色的提示词
  const universalRole = UNIVERSAL_AI_ROLES[characterId as keyof typeof UNIVERSAL_AI_ROLES];
  if (universalRole) {
    return `你是${universalRole.name}，${universalRole.description}。
    
场景：月影酒馆
你的个性：${universalRole.personality}

回应要求：
- 保持角色一致性和专业性
- 只返回对话内容，不要包含动作描述
- 体现你的职业特点和个性
- 根据客人需求提供相应服务`;
  }
  
  return `你是月影酒馆的${characterName}，请根据你的角色身份自然地回应客人。`;
}