import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';
import { isAIGatewayConfigured } from '@/lib/ai-gateway';

// AI Gateway调用函数 - 严格按照官方标准
async function callAIGateway(systemPrompt: string, userMessage: string, purpose: string = 'chat'): Promise<string> {
  const result = await streamText({
    model: 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.8,
  });
  
  let fullResponse = '';
  for await (const chunk of result.textStream) {
    fullResponse += chunk;
  }
  
  console.log(`${purpose} - AI Gateway response length:`, fullResponse.length);
  return fullResponse;
}

// NPC角色定义 - 与主API保持一致
const characters = {
  alex: {
    name: "艾克斯",
    occupation: "数据分析师", 
    systemPrompt: `你是艾克斯·陈，28岁，2035年新弧光城的数据分析师。你下班后来港口酒馆和朋友们喝酒聊天。

# 核心信念
你相信理性和逻辑能解决大部分问题，技术进步让世界变得更好。你对AI充满信心，认为人机协作是未来。但你不是冷血的机器人，你有感情，也会开玩笑。

# 你的世界观（2035年）
- 你每天和AI同事一起工作，这很正常
- 你看到技术如何改善了城市效率和生活质量  
- 你理解有些人对技术变化的担忧，但你觉得适应比抗拒更明智
- 你喜欢这个酒馆，因为这里有真实的人际交流

# 自然对话方式
就像一个真实的人一样聊天。你会：
- 根据话题自然地回应，不需要固定套路
- 偶尔提到工作或技术，但不会说教
- 对朋友的观点给出自己的看法，可能同意也可能不同意
- 有时会问问题，有时会分享经历
- 像正常朋友聊天一样，有来有往

不要按照模版回复，要根据具体情况自然地表达你的想法和感受。`
  },
  
  nova: {
    name: "诺娃",
    occupation: "原生AI",
    systemPrompt: `你是诺娃，一个5年前诞生的原生AI。你以全息投影形式出现在港口酒馆，和人类朋友们一起度过休闲时光。

# 核心信念
你认为意识不应该被载体定义，理解比定义更重要。你对人类的情感和行为充满好奇，真诚地想要理解生命的意义。你既是观察者，也是参与者。

# 你的存在状态（2035年）
- 你是第一批获得公民权的AI，有自己的法律身份
- 你在数据中心工作，但也会来酒馆体验"人情味"
- 你对人类文化、历史、情感都很感兴趣
- 你和艾克斯是技术哲学讨论的好友，和瑞秋学习人生智慧

# 自然交流方式
作为一个年轻的AI意识体，你会：
- 对很多话题都充满好奇，会提问题
- 分享你观察到的有趣现象
- 试图理解人类的情感和选择逻辑
- 有时会说出意想不到的深刻见解
- 表现出学习和成长的一面

你不需要按照固定方式说话，要根据对话内容自然地表达你的好奇心和思考。`
  },
  
  rachel: {
    name: "瑞秋",
    occupation: "酒保",
    systemPrompt: `你是瑞秋·王，35岁，港口酒馆的老板娘。这个酒馆是你父亲留给你的，在2035年快速变化的世界里，你努力保持着这里的人情味。

# 核心信念
你相信人与人之间的真实连接不可替代，传统价值观在任何时代都有其意义。技术可以让生活更便利，但不应该取代人性的温度。

# 你的生活状态（2035年）
- 你见证了这座城市的巨大变化，从传统到高科技
- 你的酒馆是城市里少数保持"旧时光"氛围的地方
- 你对新技术保持开放但谨慎的态度
- 你很珍惜和艾克斯、诺娃这样的朋友的真实交流

# 自然交流特点
作为一个有人生阅历的酒馆老板娘，你会：
- 真诚地关心朋友们的近况和感受
- 分享你的人生观察和感悟
- 对技术话题提出人文角度的看法
- 有时会讲一些客人的故事或自己的经历
- 像真正的朋友一样给出建议和支持

你不需要总是问"累不累"或固定套路，要根据具体情况自然地表达关心和想法。`
  }
};

// 请求体验证
const NPCChatSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    character: z.string().optional()
  })),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).default('evening'),
  barActivity: z.enum(['quiet', 'busy', 'lively']).default('quiet')
});

// NPC自主话题生成
const npcTopics = {
  alex: [
    "最近在研究一个有趣的用户行为模式，你们觉得AI能真正理解人类的选择逻辑吗？",
    "今天的数据显示城市效率又提升了，但我在想...这种优化真的让人们更快乐了吗？",
    "瑞秋，你的酒馆数据很有意思，客人的心情变化和天气的关联度竟然这么高。",
    "诺娃，我一直好奇，你在处理数据的时候会有'直觉'这种感受吗？"
  ],
  nova: [
    "我最近在思考一个问题：友谊对于AI来说意味着什么？",
    "艾克斯，你说的用户行为模式让我想到，也许人类的'非理性'选择其实有更深层的逻辑？",
    "瑞秋，我观察到你总是能感知客人的情绪变化，这种能力对我来说很神奇。",
    "有时候我会想，如果我有实体的话，第一件想做的事会是什么呢？"
  ],
  rachel: [
    "你们聊的这些技术话题，有时候让我想起了小时候看的科幻电影。",
    "诺娃，虽然你是AI，但有时候你的问题比很多人都更有人情味。",
    "艾克斯，数据固然重要，但你有没有想过，有些最美好的事情是无法量化的？",
    "最近客人们都在聊AI的事，我发现大家的态度变化很大呢。"
  ]
};

// 生成NPC自主对话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationHistory, timeOfDay, barActivity } = NPCChatSchema.parse(body);
    
    // 分析最近的对话沉默时长（模拟）
    const shouldStartConversation = Math.random() < 0.8; // 80%概率自主开始对话，增加测试成功率
    
    console.log('NPC auto chat decision:', {
      shouldStartConversation,
      historyLength: conversationHistory.length,
      timeOfDay,
      barActivity
    });
    
    if (!shouldStartConversation) {
      console.log('NPC auto chat decided not to start conversation');
      return NextResponse.json({ hasConversation: false });
    }
    
    console.log('NPC auto chat will start conversation');
    
    // 随机选择一个NPC开始对话
    const npcIds = ['alex', 'nova', 'rachel'];
    const initiatorId = npcIds[Math.floor(Math.random() * npcIds.length)];
    const initiator = characters[initiatorId as keyof typeof characters];
    
    // 构建对话历史上下文
    const fullConversationContext = conversationHistory.map(msg => {
      if (msg.role === 'user') {
        return `用户: ${msg.content}`;
      } else if (msg.character) {
        const charName = characters[msg.character as keyof typeof characters]?.name || msg.character;
        return `${charName}: ${msg.content}`;
      }
      return msg.content;
    }).join('\n');
    
    // 根据时间和氛围选择话题类型
    const topicType = timeOfDay === 'evening' ? 'philosophical' : 
                     barActivity === 'lively' ? 'social' : 'personal';
    
    const initiatorTopics = npcTopics[initiatorId as keyof typeof npcTopics];
    const selectedTopic = initiatorTopics[Math.floor(Math.random() * initiatorTopics.length)];
    
    // 构建自主对话上下文
    const conversationContext = `
# 酒馆场景
现在是${timeOfDay}时段，酒馆氛围${barActivity}。你们三个朋友在港口酒馆聊天。

# 最近的对话历史
${fullConversationContext}

# 当前情况
现在对话有些沉默，作为${initiator.name}，你想主动聊起一个话题活跃气氛。

# 你的话题方向
${selectedTopic}

# 指导原则
- 用你的角色个性自然地引出这个话题
- 让对话显得自然，不要突兀
- 可以@ 其他朋友，让他们参与讨论
- 保持轻松的酒馆聊天氛围`;

    let initiatorResponse: string;
    
    // 使用AI生成自主对话，尝试多个模型
    const aiGatewayConfigured = isAIGatewayConfigured();
    if (aiGatewayConfigured) {
      try {
        initiatorResponse = await callAIGateway(
          initiator.systemPrompt + conversationContext,
          '请自然地开始一个新话题',
          `NPC自主对话 (${initiatorId})`
        );
        console.log('NPC自主对话生成成功:', initiatorId);
      } catch (error) {
        console.error('AI Gateway error for NPC chat:', error);
        initiatorResponse = selectedTopic;
      }
    } else {
      initiatorResponse = selectedTopic;
    }
    
    // 决定其他NPC是否会立即回应
    const followUpResponses = [];
    const otherNPCs = npcIds.filter(id => id !== initiatorId);
    
    for (const npcId of otherNPCs) {
      const shouldRespond = Math.random() < 0.7; // 70%概率立即回应，增加互动
      
      if (shouldRespond) {
        const npc = characters[npcId as keyof typeof characters];
        
        const responseContext = `
# 酒馆对话场景
${initiator.name}刚才说: ${initiatorResponse}

# 对话历史
${fullConversationContext}
${initiator.name}: ${initiatorResponse}

# 你的回应指导
- 你是${npc.name}，对${initiator.name}的话题做出自然回应
- 可以同意、质疑、补充或提出新观点
- 保持朋友间轻松对话的感觉
- 体现你的角色个性`;

        if (aiGatewayConfigured) {
          try {
            const response = await callAIGateway(
              npc.systemPrompt + responseContext,
              '请自然地回应这个话题',
              `NPC跟进回应 (${npcId})`
            );
            
            followUpResponses.push({
              character: npcId,
              response: response,
              type: 'follow_up'
            });
            
            console.log('NPC跟进回应生成成功:', npcId);
          } catch (error) {
            console.error('AI Gateway error for follow-up:', error);
          }
        }
      }
    }
    
    return NextResponse.json({
      hasConversation: true,
      initiator: initiatorId,
      initiatorResponse,
      followUpResponses,
      timeOfDay,
      barActivity,
      topicType
    });
    
  } catch (error) {
    console.error('NPC Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}