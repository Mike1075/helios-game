import { NextApiRequest, NextApiResponse } from 'next'
import { callDeepSeekAPI } from '../../utils/deepseek-api'

interface ChatRequest {
  message: string
  player_id: string
  characterName: string
  characterPurpose: string
}

interface ChatResponse {
  reply: string
  character_name: string
  belief_update?: any
}

// 内存中存储玩家的信念系统和最近的对话历史
// player_id -> {
//   "beliefs": { "worldview": ..., "selfview": ..., "values": [...], "rules": [...] },
//   "message_history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
// }
const player_data_store: Record<string, {
  beliefs: {
    worldview: string
    selfview: string
    values: string[]
    rules: string[]
  }
  message_history: Array<{
    role: 'user' | 'assistant'
    content: string
    character_name?: string
    timestamp: string
  }>
}> = {}

// 初始化玩家信念系统
function initializePlayerBeliefs(player_id: string, characterName: string, characterPurpose: string) {
  if (!player_data_store[player_id]) {
    player_data_store[player_id] = {
      beliefs: {
        worldview: "世界是未知的，充满可能性",
        selfview: `我是一个名为"${characterName}"的探索者`,
        values: ["探索未知", "寻找真相", "成长学习"],
        rules: ["保持好奇心", "尊重他人", "勇敢面对挑战"]
      },
      message_history: []
    }
    console.log(`初始化玩家信念系统: ${characterName} (${player_id})`)
  }
}

// 模拟NPC角色数据
const characters_db = {
  "guard_elvin": {
    id: "guard_elvin",
    name: "卫兵艾尔文",
    role: "港口卫兵",
    core_motivation: "维护港口秩序，保护无辜者",
    beliefs: {
      "worldview": "世界需要秩序来保护弱者",
      "selfview": "我是秩序的守护者",
      "values": ["维护秩序是最高职责", "保护无辜者是神圣使命"],
      "rules": [
        "当秩序与个人利益冲突时，选择秩序",
        "优先保护弱者和无辜者"
      ]
    }
  },
  "priestess_lila": {
    id: "priestess_lila",
    name: "祭司莉拉",
    role: "港口祭司",
    core_motivation: "传播信仰，帮助需要帮助的人",
    beliefs: {
      "worldview": "信仰能给人力量和希望",
      "selfview": "我是信仰的传播者和守护者",
      "values": ["信仰是心灵的支柱", "帮助他人是神圣的使命"],
      "rules": [
        "用信仰的力量帮助他人",
        "对所有人都要慈悲"
      ]
    }
  },
  "merchant_karl": {
    id: "merchant_karl",
    name: "商人卡尔",
    role: "港口商人",
    core_motivation: "寻找商机，获取利润",
    beliefs: {
      "worldview": "金钱是世界的驱动力",
      "selfview": "我是精明的商人",
      "values": ["利润至上", "信息就是财富"],
      "rules": [
        "永远寻找有利可图的交易",
        "保持商业机密"
      ]
    }
  },
  "sailor_maya": {
    id: "sailor_maya",
    name: "水手玛雅",
    role: "经验丰富的水手",
    core_motivation: "探索未知的海域，寻找冒险",
    beliefs: {
      "worldview": "大海蕴含着无限的可能",
      "selfview": "我是勇敢的探险者",
      "values": ["自由比安全更重要", "经验是最好的老师"],
      "rules": [
        "永远保持好奇心",
        "分享航海故事"
      ]
    }
  }
}

function get_character_by_context(message: string) {
  const message_lower = message.toLowerCase()
  
  // 根据关键词选择不同的NPC
  if (message_lower.includes("祭司") || message_lower.includes("莉拉") || 
      message_lower.includes("信仰") || message_lower.includes("祈祷") || 
      message_lower.includes("帮助") || message_lower.includes("神圣")) {
    return characters_db["priestess_lila"]
  }
  
  if (message_lower.includes("商人") || message_lower.includes("卡尔") || 
      message_lower.includes("交易") || message_lower.includes("买卖") || 
      message_lower.includes("价格") || message_lower.includes("商品")) {
    return characters_db["merchant_karl"]
  }
  
  if (message_lower.includes("水手") || message_lower.includes("玛雅") || 
      message_lower.includes("航海") || message_lower.includes("大海") || 
      message_lower.includes("船只") || message_lower.includes("冒险")) {
    return characters_db["sailor_maya"]
  }
  
  // 默认返回卫兵
  return characters_db["guard_elvin"]
}

function create_system_prompt(character: any, playerName: string, playerPurpose: string) {
  const beliefs = character.beliefs
  
  return `你是${character.name}，${character.role}。

【角色背景】
你的核心动机是：${character.core_motivation}

你的信念系统：
- 世界观：${beliefs['worldview']}
- 自我认知：${beliefs['selfview']}
- 价值观：${beliefs['values'].join(', ')}
- 行为准则：${beliefs['rules'].join(', ')}

【当前场景】
你正在港口酒馆中。一个名为"${playerName}"的旅者走了进来，他的目的是"${playerPurpose}"。

【回应要求】
1. 身份认同：你永远是${character.name}，不是${playerName}
2. 个性化回应：根据你的信念系统和性格特点回应
3. 情境感知：考虑玩家的目的"${playerPurpose}"来调整回应
4. 自然对话：使用符合你身份的语言风格和表达方式
5. 情感连接：在对话中体现你对玩家的关心和理解
6. 信息提供：根据你的专业领域提供有价值的信息或建议

【回应风格】
- 语言风格：符合你的身份和性格
- 情感表达：体现你的价值观和信念
- 互动方式：根据玩家的目的调整回应策略
- 长度控制：简洁有力，避免冗长

请用中文回应，保持角色的一致性和个性化。`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, player_id, characterName, characterPurpose }: ChatRequest = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // 选择合适的NPC
    const character = get_character_by_context(message)
    
    // 初始化玩家信念系统（必须在调用AI之前）
    initializePlayerBeliefs(player_id, characterName, characterPurpose)
    
    // 创建系统提示词
    const system_prompt = create_system_prompt(character, characterName, characterPurpose)
    
    // 调用DeepSeek API生成智能回复
    async function generateAIResponse(character: any, playerName: string, playerPurpose: string, userMessage: string) {
      try {
        const systemPrompt = create_system_prompt(character, playerName, playerPurpose)
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userMessage }
        ]
        
        console.log(`正在为${character.name}生成回复...`)
        const aiResponse = await callDeepSeekAPI(messages)
        console.log('AI回复生成成功')
        return aiResponse
      } catch (error) {
        console.error('DeepSeek API调用失败，使用备用回复:', error)
        console.log('切换到备用回复系统...')
        // 备用回复逻辑
        return generateFallbackResponse(character, playerName, playerPurpose, userMessage)
      }
    }
    
    // 智能备用回复生成函数（当API调用失败时使用）
    function generateFallbackResponse(character: any, playerName: string, playerPurpose: string, userMessage: string) {
      const messageLower = userMessage.toLowerCase()
      
      // 根据角色、关键词和玩家目的生成个性化回复
      if (character.id === "guard_elvin") {
        if (messageLower.includes("你好") || messageLower.includes("在吗") || messageLower.includes("有人")) {
          return `欢迎来到港口，${playerName}。我是卫兵艾尔文，负责维护这里的秩序。看到你带着"${playerPurpose}"的目的来到这里，我希望能确保你的安全。有什么我可以帮助你的吗？`
        }
        if (messageLower.includes("危险") || messageLower.includes("安全") || messageLower.includes("保护")) {
          return `安全永远是第一位的，${playerName}。作为港口的守护者，我建议你在追求"${playerPurpose}"的同时，也要注意周围的环境。如果需要保护或指引，我很乐意帮助。`
        }
        if (messageLower.includes("方向") || messageLower.includes("哪里") || messageLower.includes("通往")) {
          return `港口通向多个方向，${playerName}。东边是神秘的森林，西边是古老的矿山，南边是繁华的贸易城市。根据你的目的"${playerPurpose}"，我建议你先了解清楚每个方向的风险。`
        }
        return `我理解你的想法，${playerName}。作为港口的守护者，我的职责就是保护像你这样的旅者。请告诉我更多关于你的计划，这样我就能更好地帮助你。`
      }
      
      if (character.id === "priestess_lila") {
        if (messageLower.includes("你好") || messageLower.includes("在吗") || messageLower.includes("有人")) {
          return `愿光明与你同在，${playerName}。我是祭司莉拉。看到你带着"${playerPurpose}"的愿望来到这里，我相信信仰会指引你的道路。有什么我可以帮助你的吗？`
        }
        if (messageLower.includes("信仰") || messageLower.includes("祈祷") || messageLower.includes("神圣")) {
          return `信仰是心灵的支柱，${playerName}。你的目的"${playerPurpose}"让我感受到了内心的召唤。也许这正是命运的安排，让你在这里找到内心的平静。`
        }
        if (messageLower.includes("帮助") || messageLower.includes("指引") || messageLower.includes("建议")) {
          return `作为信仰的传播者，我相信每个人都有神圣的使命，${playerName}。你的"${playerPurpose}"或许正是你内心深处的呼唤。请告诉我更多关于你的故事，也许我能为你提供一些指引。`
        }
        return `你的话语让我感受到了内心的共鸣，${playerName}。作为信仰的传播者，我相信每个人都有神圣的使命。请告诉我更多关于你的故事，也许我能为你提供一些指引。`
      }
      
      if (character.id === "merchant_karl") {
        if (messageLower.includes("你好") || messageLower.includes("在吗") || messageLower.includes("有人")) {
          return `欢迎，${playerName}！我是商人卡尔。看到你带着"${playerPurpose}"的目的来到这里，我想我们可能有生意可谈。有什么我可以帮助你的吗？`
        }
        if (messageLower.includes("买卖") || messageLower.includes("交易") || messageLower.includes("价格") || messageLower.includes("商品")) {
          return `商业机会无处不在，${playerName}。你的"${playerPurpose}"听起来很有商业价值。我这里有各种商品，从东方的丝绸到西方的宝石。有兴趣合作吗？`
        }
        if (messageLower.includes("赚钱") || messageLower.includes("利润") || messageLower.includes("商机")) {
          return `利润是商人的追求，${playerName}。你的"${playerPurpose}"让我看到了商机。如果你需要任何商业建议或合作机会，随时来找我。我出价公道，而且能帮你找到最好的买家。`
        }
        return `你的想法很有商业头脑，${playerName}。作为商人，我欣赏有远见的人。如果你需要任何商业建议或合作机会，随时来找我。`
      }
      
      if (character.id === "sailor_maya") {
        if (messageLower.includes("你好") || messageLower.includes("在吗") || messageLower.includes("有人")) {
          return `嗨，${playerName}！我是水手玛雅。看到你带着"${playerPurpose}"的梦想来到这里，让我想起了我第一次出海的兴奋。有什么我可以帮助你的吗？`
        }
        if (messageLower.includes("大海") || messageLower.includes("航海") || messageLower.includes("船只") || messageLower.includes("冒险")) {
          return `大海蕴含着无限的可能，${playerName}！你的"${playerPurpose}"让我想起了那些激动人心的航海故事。大海深处藏着无数秘密，如果你需要航海经验或船只信息，我很乐意分享。`
        }
        if (messageLower.includes("故事") || messageLower.includes("经历") || messageLower.includes("传说")) {
          return `每个水手都有自己的故事，${playerName}。你的"${playerPurpose}"让我想起了那些传说中的海盗宝藏！想听听我的冒险经历吗？大海教会了我，自由比安全更重要。`
        }
        return `你的冒险精神让我想起了年轻时的自己，${playerName}。作为水手，我相信每个旅程都有其意义。如果你需要任何航海建议或冒险故事，随时来找我。`
      }
      
      return `我理解你的想法，${playerName}。请告诉我更多，这样我就能更好地帮助你。`
    }

    let aiResponse: string
    try {
      aiResponse = await generateAIResponse(character, characterName, characterPurpose, message)
    } catch (error) {
      console.error('DeepSeek API调用失败，使用备用回复:', error)
      // 使用备用回复
      aiResponse = generateFallbackResponse(character, characterName, characterPurpose, message)
    }

    // 更新对话历史
    const userLog = {
      role: 'user' as const,
      content: message,
      character_name: characterName,
      timestamp: new Date().toISOString()
    }

    const aiLog = {
      role: 'assistant' as const,
      content: aiResponse,
      character_name: character.name,
      timestamp: new Date().toISOString()
    }

    player_data_store[player_id].message_history.push(userLog, aiLog)

    // 保持对话历史在合理范围内（最多20条）
    if (player_data_store[player_id].message_history.length > 20) {
      player_data_store[player_id].message_history = player_data_store[player_id].message_history.slice(-20)
    }

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    const response: ChatResponse = {
      reply: aiResponse,
      character_name: character.name,
      belief_update: {
        interaction_count: 1, // 每次对话计数为1
        last_interaction: new Date().toISOString(),
        player_message: message,
        character_response: aiResponse,
        message_stored: true // 表示消息已存储到内存
      }
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
