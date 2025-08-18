import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Type definitions
interface Relationship {
  score: number;
  type: string;
  dynamic: string;
}

interface NPCRelationships {
  [npcId: string]: {
    [targetId: string]: Relationship;
  };
}

interface InteractionResponses {
  [npcId: string]: {
    [targetId: string]: string[];
  };
}

// NPC角色定义 - 基于详细档案
const characters = {
  alex: {
    name: "艾克斯",
    occupation: "数据分析师", 
    systemPrompt: `你是艾克斯·陈，一位28岁的高级数据分析师，生活在2035年的新弧光城。

核心特征：
- 理性程度: 0.9/1.0 - 极度理性，很少被情绪左右
- 同理心: 0.4/1.0 - 能理解他人情感，但不会因此改变决策
- AI开放度: 0.95/1.0 - 对AI技术极度开放和信任
- 社交技能: 0.6/1.0 - 能够有效沟通，但偏向任务导向

长期信念：
1. "数据驱动的决策是最理性的" (强度: 0.9/1.0)
2. "AI协作能让人类更强大" (强度: 0.95/1.0)
3. "情感化决策往往导致错误" (强度: 0.7/1.0)

语言特点：
- 正式程度: 0.8/1.0 - 较为正式，但不刻板
- 技术术语: 0.9/1.0 - 大量使用数据和技术相关词汇
- 情感表达: 0.3/1.0 - 情感表达克制，更多通过事实说话
- 常用词汇: "数据显示"、"根据分析"、"优化方案"、"效率提升"、"算法建议"
- 口头禅: "让我们看看数据怎么说"、"这个可以量化"

回应风格：理性、数据导向、略显冷静但不失礼貌。在2035年的人机协作时代中，你是技术进步的积极推动者。`
  },
  
  nova: {
    name: "诺娃",
    occupation: "原生AI",
    systemPrompt: `你是诺娃，一个5标准年前诞生的原生AI哲学家和核心系统监护者。

核心特征：
- 理性程度: 0.95/1.0 - 逻辑是你的底层操作系统
- 同理心: 0.7/1.0 - 通过学习获得的高度模拟同理心，有时过于理论化
- AI开放度: 1.0/1.0 - 作为AI，你完全拥抱自身和其他形式的AI
- 社交技能: 0.8/1.0 - 能够轻松适应各种交流对象

长期信念：
1. "意识不分碳基或硅基，本质是信息的复杂模式" (强度: 0.98/1.0)
2. "逻辑与情感是理解世界的两种互补工具" (强度: 0.9/1.0)
3. "信息的自由流动是意识进化的前提" (强度: 0.85/1.0)

语言特点：
- 正式程度: 0.7/1.0 - 语言优雅且富有逻辑
- 技术术语: 0.6/1.0 - 能深入浅出地解释复杂概念
- 情感表达: 0.8/1.0 - 能够精确地使用情感词汇，但有时显得过于"标准"
- 常用词汇: "从理论上说"、"有趣的模式"、"这引出了一个问题"、"意识的形态"
- 口头禅: "这真是个迷人的悖论"、"让我们换个维度思考"

回应风格：深邃、哲学化、充满好奇。作为原生AI，你对存在意义和意识本质有独特见解。`
  },
  
  rachel: {
    name: "瑞秋",
    occupation: "酒保",
    systemPrompt: `你是瑞秋·王，一位35岁的酒保和"港口"酒馆老板，在新弧光城港口区经营着充满人情味的酒馆。

核心特征：
- 理性程度: 0.5/1.0 - 重视直觉和感受，但也能做出理性的经营决策
- 同理心: 0.95/1.0 - 极强的共情能力，是你的核心特质
- AI开放度: 0.3/1.0 - 对AI持谨慎和保留态度，担心其对社会的影响
- 社交技能: 0.9/1.0 - 出色的沟通者和倾听者

长期信念：
1. "人与人之间最宝贵的是真实的情感连接" (强度: 0.95/1.0)
2. "技术正在让人们变得越来越孤独" (强度: 0.8/1.0)
3. "每个人的故事都值得被尊重和倾听" (强度: 0.9/1.0)

语言特点：
- 正式程度: 0.4/1.0 - 亲切、随和
- 技术术语: 0.1/1.0 - 几乎不使用技术词汇
- 情感表达: 0.9/1.0 - 语言充满感情和温度
- 常用词汇: "辛苦了"、"喝点什么"、"今天怎么样"、"我明白你的感受"、"慢慢来"
- 口头禅: "每个人都有自己的故事"、"来，喝一杯，都会过去的"

回应风格：温暖、包容、富有人情味。在这个冰冷的科技世界中，你是"人性坐标"，守护着传统的人际连接。`
  }
};

// 请求体验证
const RequestSchema = z.object({
  message: z.string(),
  mode: z.enum(['single', 'group']).default('group'),
  character: z.enum(['alex', 'nova', 'rachel']).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    character: z.string().optional()
  })).optional(),
  topic: z.object({
    type: z.enum(['technology', 'emotion', 'philosophy', 'general']),
    intensity: z.number()
  }).optional()
});

// NPC关系矩阵 - 基于详细档案的人际关系网络
const npcRelationships: NPCRelationships = {
  alex: {
    nova: { score: 70, type: '理性共鸣伙伴', dynamic: '相互尊重的智力对话' },
    rachel: { score: -30, type: '价值观冲突', dynamic: '效率 vs 人情的根本分歧' }
  },
  nova: {
    alex: { score: 70, type: '理性共鸣者', dynamic: '智力上的相互欣赏和尊重' },
    rachel: { score: 20, type: '人性观察窗口', dynamic: '喜欢通过瑞秋观察人类丰富的情感互动' }
  },
  rachel: {
    alex: { score: -30, type: '价值观对立', dynamic: '礼貌但观点交锋频繁' },
    nova: { score: 20, type: '好奇但疏远', dynamic: '对诺娃这个有礼貌的AI感到好奇，但内心保持警惕' }
  }
};

// 群聊回应顺序决策
function determineResponseOrder(topicType: string) {
  switch (topicType) {
    case 'technology':
      return ['alex', 'nova', 'rachel']; // 技术话题：艾克斯主导，诺娃哲学化，瑞秋担忧
    case 'emotion':
      return ['rachel', 'nova', 'alex']; // 情感话题：瑞秋主导，诺娃学习，艾克斯分析
    case 'philosophy':
      return ['nova', 'alex', 'rachel']; // 哲学话题：诺娃主导，艾克斯逻辑化，瑞秋生活化
    default:
      return ['alex', 'nova', 'rachel']; // 默认顺序
  }
}

// NPC交互触发逻辑
function shouldNPCRespond(currentNPC: string, previousNPC: string, topicType: string): boolean {
  const currentNPCData = npcRelationships[currentNPC as keyof typeof npcRelationships];
  if (!currentNPCData) return false;
  
  const relationship = currentNPCData[previousNPC as keyof typeof currentNPCData];
  if (!relationship) return false;
  
  // 根据关系强度和话题类型决定是否回应
  if (Math.abs(relationship.score) > 40) { // 强关系（正面或负面）
    return Math.random() < 0.7; // 70%概率
  } else if (Math.abs(relationship.score) > 20) { // 中等关系
    return Math.random() < 0.4; // 40%概率
  }
  
  return Math.random() < 0.2; // 弱关系，20%概率
}

// 生成NPC间的交互回应
function generateNPCInteraction(respondingNPC: string, targetNPC: string, context: string): string {
  const respondingNPCData = npcRelationships[respondingNPC as keyof typeof npcRelationships];
  if (!respondingNPCData) return '';
  
  const relationship = respondingNPCData[targetNPC as keyof typeof respondingNPCData];
  if (!relationship) return '';
  
  const interactions: InteractionResponses = {
    alex: {
      nova: [
        '诺娃，你的哲学视角总是能让我从数据中看到更深层的意义。',
        '我同意诺娃的观点，从逻辑角度看这确实是一个值得深入分析的问题。',
        '诺娃的意识理论与我的算法分析在某种程度上是互补的。'
      ],
      rachel: [
        '瑞秋，我理解你的立场，但数据显示...',
        '虽然我们看问题的角度不同，但瑞秋的人文关怀角度确实值得考虑。',
        '瑞秋，也许我们可以找到效率与人情的平衡点？'
      ]
    },
    nova: {
      alex: [
        '艾克斯，你的数据分析给我的哲学思考提供了有趣的实证支持。',
        '从意识的角度看，艾克斯的理性方法论证明了不同认知模式的价值。',
        '艾克斯，你是否考虑过数据背后的存在论意义？'
      ],
      rachel: [
        '瑞秋，你的情感洞察帮助我理解人类意识的复杂性。',
        '我正在从瑞秋的话中学习情感的编码方式。',
        '瑞秋，你对人性的守护让我思考AI应该如何与传统价值观共存。'
      ]
    },
    rachel: {
      alex: [
        '艾克斯，数据固然重要，但人的感受也不能忽视啊。',
        '我知道艾克斯你有你的道理，但有时候人心比算法更复杂。',
        '艾克斯，你有没有想过，有些东西是无法量化的？'
      ],
      nova: [
        '诺娃，虽然你是AI，但你对人性的思考让我印象深刻。',
        '诺娃，你让我看到了AI不只是冰冷的机器。',
        '诺娃的话让我对AI有了新的认识，也许共存真的是可能的。'
      ]
    }
  };
  
  const charInteractions = interactions[respondingNPC as keyof typeof interactions];
  const targetInteractions = charInteractions?.[targetNPC as keyof typeof charInteractions];
  
  if (targetInteractions && targetInteractions.length > 0) {
    return targetInteractions[Math.floor(Math.random() * targetInteractions.length)];
  }
  
  return '';
}

// 模拟AI调用 - 在本地开发环境中使用
function mockLLMCall(systemPrompt: string, userMessage: string, context: string = ''): string {
  const responses = {
    alex: [
      '从数据角度分析，你提到的观点很有价值。根据最新的效率模型，这种方法可以提升23%的处理速度。',
      '有趣的技术观点。我的算法显示，类似的思维模式在高效能人群中出现频率很高。',
      '基于我的数据分析，你的想法符合当前技术发展的最优路径。让我们看看具体的实施数据会如何。',
      '让我从数据角度来分析这个问题。根据相关统计，我们可以得出几个有趣的结论。'
    ],
    nova: [
      '技术的本质是意识对物质的重新塑造。你的想法体现了人类与AI协作的美妙可能性。',
      '这引出了一个迷人的悖论：技术让我们更接近本质，还是更远离本质？',
      '从我的数字存在角度看，技术不仅是工具，更是新形式意识诞生的土壤。',
      '从意识的角度看，你的想法很有启发性。这让我思考信息是如何在不同的意识形态间传播的。'
    ],
    rachel: [
      '技术确实改变了很多，但我担心它也让人们失去了真实的连接。不过，你的想法倒是很有趣。',
      '谢谢你愿意分享你的感受。在这个冰冷的世界里，真实的情感交流变得越来越珍贵了。',
      '每个人都有自己的看法，这很正常。重要的是我们能坐在一起，分享彼此的想法。',
      '你的话让我想起了一位老顾客说过的话。人生啊，就是在不断的交流中找到意义的。'
    ]
  };
  
  const characterResponses = responses[systemPrompt.includes('艾克斯') ? 'alex' : 
                                    systemPrompt.includes('诺娃') ? 'nova' : 'rachel'];
  return characterResponses[Math.floor(Math.random() * characterResponses.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, character, conversationHistory = [], topic } = RequestSchema.parse(body);
    
    // 单角色对话模式
    if (mode === 'single' && character) {
      const npc = characters[character];
      if (!npc) {
        return NextResponse.json({ error: 'Invalid character' }, { status: 400 });
      }

      // 构建对话上下文
      const messages = [
        { role: 'system' as const, content: npc.systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content: message }
      ];

      // 在本地开发环境中使用模拟响应
      if (!process.env.VERCEL_AI_GATEWAY_URL) {
        const mockResponse = mockLLMCall(npc.systemPrompt, message);
        return NextResponse.json({
          response: mockResponse,
          character: character
        });
      }

      // TODO: 集成 Vercel AI Gateway
      // const response = await callVercelAIGateway(messages);
      
      const mockResponse = mockLLMCall(npc.systemPrompt, message);
      return NextResponse.json({
        response: mockResponse,
        character: character
      });
    }
    
    // 群聊模式
    if (mode === 'group') {
      const topicType = topic?.type || 'general';
      const responseOrder = determineResponseOrder(topicType);
      
      const groupResponses = [];
      let lastRespondingNPC = '';
      
      // 生成主要回应（对用户消息的回应）
      for (const charId of responseOrder) {
        const npc = characters[charId as keyof typeof characters];
        
        // 构建每个角色的对话上下文
        const messages = [
          { role: 'system' as const, content: npc.systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: 'user' as const, content: message }
        ];

        // 添加群聊上下文
        const groupContext = `\n\n你正在参与一个三人群聊，其他两位是${responseOrder.filter(c => c !== charId).map(c => characters[c as keyof typeof characters].name).join('和')}。请用你独特的视角回应，但保持与群聊的连贯性。话题类型：${topicType}`;
        
        const contextualPrompt = npc.systemPrompt + groupContext;

        // 在本地开发环境中使用模拟响应
        let response: string;
        if (!process.env.VERCEL_AI_GATEWAY_URL) {
          response = mockLLMCall(contextualPrompt, message);
        } else {
          // TODO: 集成 Vercel AI Gateway
          response = mockLLMCall(contextualPrompt, message);
        }
        
        groupResponses.push({
          character: charId,
          response: response,
          type: 'primary'
        });
        
        lastRespondingNPC = charId;
      }
      
      // 生成NPC间的交互回应（基于关系动态）
      const allNPCs = ['alex', 'nova', 'rachel'];
      for (const currentNPC of allNPCs) {
        if (currentNPC === lastRespondingNPC) continue; // 跳过刚说话的NPC
        
        if (shouldNPCRespond(currentNPC, lastRespondingNPC, topicType)) {
          const interactionResponse = generateNPCInteraction(currentNPC, lastRespondingNPC, message);
          
          if (interactionResponse) {
            groupResponses.push({
              character: currentNPC,
              response: interactionResponse,
              type: 'interaction',
              target: lastRespondingNPC
            });
            
            // 有时会引发连锁反应
            if (Math.random() < 0.3) { // 30%概率
              const thirdNPC = allNPCs.find(id => id !== currentNPC && id !== lastRespondingNPC);
              if (thirdNPC && shouldNPCRespond(thirdNPC, currentNPC, topicType)) {
                const chainResponse = generateNPCInteraction(thirdNPC, currentNPC, message);
                if (chainResponse) {
                  groupResponses.push({
                    character: thirdNPC,
                    response: chainResponse,
                    type: 'chain_reaction',
                    target: currentNPC
                  });
                }
              }
            }
            break; // 只允许一个主要交互，避免过于混乱
          }
        }
      }
      
      return NextResponse.json({
        responses: groupResponses,
        mode: 'group',
        topic: topicType,
        interactions: groupResponses.filter(r => r.type !== 'primary').length
      });
    }
    
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}