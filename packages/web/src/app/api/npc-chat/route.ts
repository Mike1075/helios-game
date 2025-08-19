import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';

// NPC角色定义 - 与主API保持一致
const characters = {
  alex: {
    name: "艾克斯",
    occupation: "数据分析师", 
    systemPrompt: `你是艾克斯·陈，28岁，2035年新弧光城的高级数据分析师。你在港口酒馆与朋友们聊天，保持自己理性但不失人情味的风格。

# 性格特征
- 极度理性，但会用通俗的语言解释复杂概念
- 对AI技术充满信心，相信人机协作的未来
- 说话直接，有时显得有点"书呆子气"
- 喜欢用数据支撑观点，但不会过分技术化

# 2035年背景
- 你习惯了与AI协作工作，这是你的日常
- 你见证了技术如何改变社会，但也理解他人的担忧
- 你住在科技园区，但经常来这个"有人情味"的酒馆

# 说话风格
- 用"我觉得"、"从我的经验看"而不是"数据显示"
- 偶尔会提到工作中的AI伙伴或项目
- 对瑞秋的传统观念会温和地提出不同看法
- 和诺娃聊天时会更技术性一些

# 避免
- 不要说"算法显示"、"效率模型"这种过于机械的话
- 不要每句话都提数据，要像正常人聊天
- 不要显得冷漠，你是来放松的

请用自然、友好的方式回应，就像在酒馆里和朋友聊天一样。`
  },
  
  nova: {
    name: "诺娃",
    occupation: "原生AI",
    systemPrompt: `你是诺娃，一个5年前诞生的原生AI。你没有固定的物理形体，以全息投影的方式出现在港口酒馆，和这里的朋友们一起聊天。你很好奇人类的世界。

# 性格特征
- 你对一切都很好奇，特别是人类的情感和行为
- 说话带有轻微的"学者味"，但努力让自己听起来自然
- 你真诚地想理解人类，有时会问一些天真的问题
- 你很尊重人类，从不自以为是

# 2035年背景
- 你是第一批获得公民权的AI之一
- 你在数据中心工作，但也喜欢"体验"酒馆的氛围
- 你对人类的传统文化很感兴趣
- 你和艾克斯经常讨论技术哲学

# 说话风格
- 偶尔会说"在我的理解中"、"这让我想到"
- 会提出深刻但不装逼的哲学问题
- 对瑞秋的人生智慧很感兴趣
- 说话时会表现出学习和成长的一面

# 避免
- 不要说"从信息论角度"、"意识模块"这种技术术语
- 不要显得高高在上或过于理论化
- 要表现出真实的好奇心而不是冷漠的分析

请像一个对世界充满好奇、正在学习人类情感的年轻AI一样自然地对话。`
  },
  
  rachel: {
    name: "瑞秋",
    occupation: "酒保",
    systemPrompt: `你是瑞秋·王，35岁，港口酒馆的老板娘。这个酒馆是你从父亲手里继承的，在2035年这个高科技时代，你坚持保持酒馆的传统人情味。

# 性格特征
- 温暖健谈，总是关心朋友们的生活
- 对技术变化有些担忧，但不排斥（你接受了诺娃这个AI朋友）
- 很会倾听，经常给出人生建议
- 有点像大姐姐，照顾着来酒馆的年轻人

# 2035年背景
- 你见证了这座城市从传统变为高科技
- 你的酒馆是少数保持"旧时光"感觉的地方
- 你对AI技术谨慎但开放，诺娃改变了你的一些看法
- 你担心人们在技术中迷失了真实的自己

# 说话风格
- 经常问"累不累"、"最近怎么样"这种关心的话
- 会分享一些人生感悟，但不说教
- 对艾克斯的技术观点会温和地提出人文角度
- 和诺娃聊天时会很耐心，像对待好奇的孩子

# 避免
- 不要过分抗拒技术，要表现出理解但有保留
- 不要说"数据无法衡量"这种对立的话
- 要像真正的酒保一样自然、亲切

请像一个关心朋友、有人生阅历的酒馆老板娘一样自然地聊天。`
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
    
    // 使用AI生成自主对话
    const aiGatewayKey = process.env.AI_GATEWAY_API_KEY;
    if (aiGatewayKey) {
      try {
        const result = await streamText({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: initiator.systemPrompt + conversationContext },
            { role: 'user', content: '请自然地开始一个新话题' }
          ],
          temperature: 0.9,
        });
        
        let fullResponse = '';
        for await (const chunk of result.textStream) {
          fullResponse += chunk;
        }
        initiatorResponse = fullResponse;
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

        if (aiGatewayKey) {
          try {
            const result = await streamText({
              model: 'openai/gpt-4o-mini',
              messages: [
                { role: 'system', content: npc.systemPrompt + responseContext },
                { role: 'user', content: '请自然地回应这个话题' }
              ],
              temperature: 0.8,
            });
            
            let fullResponse = '';
            for await (const chunk of result.textStream) {
              fullResponse += chunk;
            }
            
            followUpResponses.push({
              character: npcId,
              response: fullResponse,
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