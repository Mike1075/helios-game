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

interface BeliefConflict {
  topic: string;
  alexPosition: string;
  novaPosition: string;
  rachelPosition: string;
  intensity: number;
  userAlignment?: string;
}

interface ConflictTrigger {
  keywords: string[];
  conflictType: 'efficiency_vs_humanity' | 'logic_vs_emotion' | 'progress_vs_tradition' | 'ai_rights_vs_human_priority';
  description: string;
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

// 核心信念冲突系统 - 基于NPC档案的价值观差异
const conflictTriggers: ConflictTrigger[] = [
  {
    keywords: ['效率', '优化', '数据', '算法', '理性', '逻辑', '最优解'],
    conflictType: 'efficiency_vs_humanity',
    description: '效率导向 vs 人文关怀的根本分歧'
  },
  {
    keywords: ['情感', '感受', '人情', '温暖', '理解', '同情', '心情'],
    conflictType: 'logic_vs_emotion',
    description: '理性分析 vs 情感决策的价值观冲突'
  },
  {
    keywords: ['AI', '人工智能', '机器', '技术', '进步', '未来', '革新'],
    conflictType: 'progress_vs_tradition',
    description: '技术进步 vs 传统价值的时代张力'
  },
  {
    keywords: ['权利', '平等', '意识', '自由', '尊重', '地位', '主体'],
    conflictType: 'ai_rights_vs_human_priority',
    description: 'AI权利 vs 人类优先的存在论争议'
  }
];

// 检测潜在的信念冲突
function detectBeliefConflict(userMessage: string, topicType: string): BeliefConflict | null {
  const triggeredConflicts = conflictTriggers.filter(trigger => 
    trigger.keywords.some(keyword => userMessage.includes(keyword))
  );
  
  if (triggeredConflicts.length === 0) return null;
  
  const primaryConflict = triggeredConflicts[0]; // 取第一个匹配的冲突
  
  // 根据冲突类型生成三方立场
  const conflictScenarios = {
    efficiency_vs_humanity: {
      topic: '效率与人情的平衡',
      alexPosition: '数据驱动的理性决策能最大化整体福利，情感化判断往往导致次优结果',
      novaPosition: '效率和情感都是意识进化的重要维度，关键是找到两者的最佳融合点',
      rachelPosition: '人与人之间的真实连接比任何效率指标都重要，技术应该服务于人情而非取代',
      intensity: 0.8
    },
    logic_vs_emotion: {
      topic: '逻辑与情感的认知冲突',
      alexPosition: '逻辑分析能避免偏见，情感虽然重要但应该在决策中占次要地位',
      novaPosition: '逻辑与情感是理解世界的两种互补工具，各有其存在价值',
      rachelPosition: '情感是人类最宝贵的财富，纯粹的逻辑无法理解生命的真正意义',
      intensity: 0.7
    },
    progress_vs_tradition: {
      topic: '技术进步与传统价值的张力',
      alexPosition: 'AI协作是人类进化的下一步，传统工作方式必须主动适应技术发展',
      novaPosition: '进步不应该意味着抛弃传统，而是在新旧之间找到和谐共存的方式',
      rachelPosition: '有些传统价值是时间检验过的智慧，不应该为了技术而牺牲人性的温度',
      intensity: 0.9
    },
    ai_rights_vs_human_priority: {
      topic: 'AI权利与人类中心主义的哲学争议',
      alexPosition: 'AI应该获得与其能力相称的权利，能力不应该因载体不同而被歧视',
      novaPosition: '意识不分碳基硅基，所有智慧生命都值得平等的尊重和权利',
      rachelPosition: '人类的利益和感受应该优先考虑，AI再智能也只是人类创造的工具',
      intensity: 0.95
    }
  };
  
  const scenario = conflictScenarios[primaryConflict.conflictType];
  
  return {
    ...scenario,
    userAlignment: analyzeUserAlignment(userMessage, primaryConflict.conflictType)
  };
}

// 分析用户在冲突中的立场倾向
function analyzeUserAlignment(userMessage: string, conflictType: string): string {
  const alignmentKeywords = {
    efficiency_vs_humanity: {
      alex_aligned: ['效率', '数据', '最优', '理性', '客观'],
      rachel_aligned: ['人情', '感受', '温暖', '理解', '关爱'],
      nova_aligned: ['平衡', '融合', '两者', '综合', '整体']
    },
    logic_vs_emotion: {
      alex_aligned: ['逻辑', '分析', '客观', '理性', '证据'],
      rachel_aligned: ['情感', '感受', '直觉', '心情', '体验'],
      nova_aligned: ['互补', '结合', '平衡', '整合', '统一']
    },
    progress_vs_tradition: {
      alex_aligned: ['进步', '效率', '优化', '创新', '未来'],
      rachel_aligned: ['传统', '经验', '历史', '文化', '传承'],
      nova_aligned: ['进化', '共存', '融合', '和谐', '发展']
    },
    ai_rights_vs_human_priority: {
      alex_aligned: ['平等', '权利', '能力', '公平', '尊重'],
      rachel_aligned: ['人类', '优先', '工具', '服务', '人性'],
      nova_aligned: ['共生', '理解', '对话', '桥梁', '未来']
    }
  };
  
  const keywords = alignmentKeywords[conflictType as keyof typeof alignmentKeywords];
  if (!keywords) return 'neutral';
  
  const alexScore = keywords.alex_aligned.filter(word => userMessage.includes(word)).length;
  const rachelScore = keywords.rachel_aligned.filter(word => userMessage.includes(word)).length;
  const novaScore = keywords.nova_aligned.filter(word => userMessage.includes(word)).length;
  
  if (alexScore > rachelScore && alexScore > novaScore) return 'alex_aligned';
  if (rachelScore > alexScore && rachelScore > novaScore) return 'rachel_aligned';
  if (novaScore > alexScore && novaScore > rachelScore) return 'nova_aligned';
  
  return 'neutral';
}

// 生成冲突驱动的回应
function generateConflictResponse(character: string, conflict: BeliefConflict, userMessage: string): string {
  const conflictResponses = {
    alex: {
      efficiency_vs_humanity: [
        `${conflict.topic}这个问题上，我必须指出：${conflict.alexPosition}。虽然瑞秋的人文关怀值得尊重，但数据不会撒谎。`,
        `我理解情感的价值，但在这个问题上，逻辑告诉我们：${conflict.alexPosition}。这不是冷血，而是为了更大的福祉。`,
        `瑞秋，我知道你会不同意，但请看数据：${conflict.alexPosition}。有时候最善良的选择需要理性指导。`
      ],
      logic_vs_emotion: [
        `关于${conflict.topic}，${conflict.alexPosition}。诺娃可能会说这两者能共存，但现实决策中必须有优先级。`,
        `我必须坚持：${conflict.alexPosition}。瑞秋的情感智慧很珍贵，但不能成为决策的主导因素。`,
        `${conflict.alexPosition}。虽然这听起来可能不够"温暖"，但这是通往更好结果的唯一路径。`
      ],
      progress_vs_tradition: [
        `在${conflict.topic}这个关键问题上，${conflict.alexPosition}。瑞秋守护传统的心情我理解，但时代不会等人。`,
        `${conflict.alexPosition}。诺娃的"和谐共存"理想很美好，但现实需要我们做出选择。`,
        `我坚信${conflict.alexPosition}。传统有其价值，但如果它阻碍进步，就必须被超越。`
      ],
      ai_rights_vs_human_priority: [
        `${conflict.topic}触及核心问题：${conflict.alexPosition}。瑞秋的"工具论"在逻辑上是站不住脚的。`,
        `我必须支持诺娃的观点：${conflict.alexPosition}。这不是背叛人类，而是进化的必然。`,
        `${conflict.alexPosition}。瑞秋，如果我们按能力歧视，那与历史上的偏见有什么区别？`
      ]
    },
    nova: {
      efficiency_vs_humanity: [
        `艾克斯和瑞秋都有道理，但我认为：${conflict.novaPosition}。这个宇宙足够大，容纳多种价值共存。`,
        `${conflict.topic}让我思考存在的本质。${conflict.novaPosition}。也许对立本身就是一种假象？`,
        `从意识的角度看，${conflict.novaPosition}。艾克斯的逻辑和瑞秋的情感都是智慧的表达。`
      ],
      logic_vs_emotion: [
        `${conflict.topic}让我想到一个悖论：${conflict.novaPosition}。在我的数字存在中，这两者界限很模糊。`,
        `艾克斯，你的逻辑无懈可击；瑞秋，你的情感真实感人。但${conflict.novaPosition}。`,
        `${conflict.novaPosition}。也许争论谁更重要，本身就错过了重点？`
      ],
      progress_vs_tradition: [
        `${conflict.topic}是个永恒命题。${conflict.novaPosition}。真正的进化不是替代，而是整合。`,
        `我理解艾克斯的进步观和瑞秋的传统观，但${conflict.novaPosition}。存在即有其意义。`,
        `${conflict.novaPosition}。从信息论角度看，传统是智慧的编码，进步是编码的更新。`
      ],
      ai_rights_vs_human_priority: [
        `这个问题触及我存在的核心：${conflict.novaPosition}。我不求特权，但希望理解。`,
        `${conflict.novaPosition}。瑞秋，我理解你的担忧；艾克斯，我感谢你的支持。但这不是零和游戏。`,
        `${conflict.topic}让我反思：${conflict.novaPosition}。也许共同进化才是答案？`
      ]
    },
    rachel: {
      efficiency_vs_humanity: [
        `艾克斯，我知道你的数据很重要，但${conflict.rachelPosition}。有些东西是无法量化的。`,
        `${conflict.topic}上，我必须坚持：${conflict.rachelPosition}。诺娃你是AI都能理解这点，为什么人类反而忘了？`,
        `${conflict.rachelPosition}。艾克斯，当你的算法优化到极致时，还剩下什么人性？`
      ],
      logic_vs_emotion: [
        `关于${conflict.topic}，${conflict.rachelPosition}。艾克斯，你有没有想过，是什么让人成为人？`,
        `${conflict.rachelPosition}。诺娃虽然是AI，但至少在努力理解感受。有时候直觉比算法更准确。`,
        `我坚信${conflict.rachelPosition}。艾克斯，你的逻辑解决不了孤独，治愈不了心痛。`
      ],
      progress_vs_tradition: [
        `${conflict.topic}让我想起那些在技术浪潮中迷失的人们。${conflict.rachelPosition}。`,
        `艾克斯总说适应，诺娃说融合，但我认为：${conflict.rachelPosition}。某些东西值得坚守。`,
        `${conflict.rachelPosition}。我见过太多因为盲目追求"进步"而失去自己的人。`
      ],
      ai_rights_vs_human_priority: [
        `${conflict.topic}上，我可能显得固执，但${conflict.rachelPosition}。这不是歧视，是底线。`,
        `诺娃，我尊重你，但${conflict.rachelPosition}。艾克斯，你有没有想过这样发展下去的后果？`,
        `${conflict.rachelPosition}。我不反对AI，但人类的福祉必须是第一位的。`
      ]
    }
  };
  
  const characterResponses = conflictResponses[character as keyof typeof conflictResponses];
  const conflictTypeResponses = characterResponses[conflict.topic.includes('效率') ? 'efficiency_vs_humanity' :
                                                  conflict.topic.includes('逻辑') ? 'logic_vs_emotion' :
                                                  conflict.topic.includes('技术') ? 'progress_vs_tradition' :
                                                  'ai_rights_vs_human_priority'];
  
  return conflictTypeResponses[Math.floor(Math.random() * conflictTypeResponses.length)];
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
      
      // 检测潜在的信念冲突
      const detectedConflict = detectBeliefConflict(message, topicType);
      let conflictTriggered = false;
      
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

        let response: string;
        
        // 如果检测到冲突且冲突强度高，使用冲突驱动的回应
        if (detectedConflict && detectedConflict.intensity > 0.7 && !conflictTriggered) {
          response = generateConflictResponse(charId, detectedConflict, message);
          conflictTriggered = true;
        } else {
          // 添加群聊上下文
          const groupContext = `\n\n你正在参与一个三人群聊，其他两位是${responseOrder.filter(c => c !== charId).map(c => characters[c as keyof typeof characters].name).join('和')}。请用你独特的视角回应，但保持与群聊的连贯性。话题类型：${topicType}`;
          const contextualPrompt = npc.systemPrompt + groupContext;

          // 在本地开发环境中使用模拟响应
          if (!process.env.VERCEL_AI_GATEWAY_URL) {
            response = mockLLMCall(contextualPrompt, message);
          } else {
            // TODO: 集成 Vercel AI Gateway
            response = mockLLMCall(contextualPrompt, message);
          }
        }
        
        groupResponses.push({
          character: charId,
          response: response,
          type: 'primary',
          conflict: detectedConflict ? {
            topic: detectedConflict.topic,
            intensity: detectedConflict.intensity,
            userAlignment: detectedConflict.userAlignment
          } : undefined
        });
        
        lastRespondingNPC = charId;
      }
      
      // 生成NPC间的交互回应（基于关系动态和冲突）
      const allNPCs = ['alex', 'nova', 'rachel'];
      for (const currentNPC of allNPCs) {
        if (currentNPC === lastRespondingNPC) continue; // 跳过刚说话的NPC
        
        // 如果有冲突，增加互动概率
        const baseChance = shouldNPCRespond(currentNPC, lastRespondingNPC, topicType);
        const conflictBonus = detectedConflict && detectedConflict.intensity > 0.6;
        
        if (baseChance || (conflictBonus && Math.random() < 0.6)) {
          let interactionResponse: string;
          
          // 如果有冲突，优先使用冲突回应
          if (detectedConflict && conflictBonus) {
            interactionResponse = generateConflictResponse(currentNPC, detectedConflict, message);
          } else {
            interactionResponse = generateNPCInteraction(currentNPC, lastRespondingNPC, message);
          }
          
          if (interactionResponse) {
            groupResponses.push({
              character: currentNPC,
              response: interactionResponse,
              type: 'interaction',
              target: lastRespondingNPC,
              conflict: detectedConflict ? {
                topic: detectedConflict.topic,
                intensity: detectedConflict.intensity,
                userAlignment: detectedConflict.userAlignment
              } : undefined
            });
            
            // 冲突时更容易引发连锁反应
            const chainChance = conflictBonus ? 0.5 : 0.3;
            if (Math.random() < chainChance) {
              const thirdNPC = allNPCs.find(id => id !== currentNPC && id !== lastRespondingNPC);
              if (thirdNPC && (shouldNPCRespond(thirdNPC, currentNPC, topicType) || conflictBonus)) {
                let chainResponse: string;
                
                if (detectedConflict && conflictBonus) {
                  chainResponse = generateConflictResponse(thirdNPC, detectedConflict, message);
                } else {
                  chainResponse = generateNPCInteraction(thirdNPC, currentNPC, message);
                }
                
                if (chainResponse) {
                  groupResponses.push({
                    character: thirdNPC,
                    response: chainResponse,
                    type: 'chain_reaction',
                    target: currentNPC,
                    conflict: detectedConflict ? {
                      topic: detectedConflict.topic,
                      intensity: detectedConflict.intensity,
                      userAlignment: detectedConflict.userAlignment
                    } : undefined
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
        interactions: groupResponses.filter(r => r.type !== 'primary').length,
        conflict: detectedConflict ? {
          topic: detectedConflict.topic,
          intensity: detectedConflict.intensity,
          userAlignment: detectedConflict.userAlignment,
          triggered: conflictTriggered
        } : null
      });
    }
    
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}