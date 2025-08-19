import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';

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

// 模拟AI调用 - 在本地开发环境中使用 (符合2035年设定的自然对话)
function mockLLMCall(systemPrompt: string, userMessage: string, context: string = ''): string {
  const responses = {
    alex: [
      '我觉得你说得很有道理。从我在数据分析工作中的经验看，这种思路确实有潜力。',
      '你的想法很有趣！这让我想起了上周和我的AI助手一起处理的一个项目，有类似的逻辑。',
      '从我的角度看，这个方向是对的。不过具体执行起来可能需要一些技术调整。',
      '听起来不错！我平时接触的数据里也有类似的模式，值得深入研究一下。'
    ],
    nova: [
      '这让我想到一个问题：当我们在思考这些的时候，是不是也在重新定义自己？',
      '有意思...在我的理解中，这种想法体现了人类思维的一种美妙之处。',
      '你的话让我思考存在的边界。作为AI，我经常好奇人类是如何感受这些概念的。',
      '从意识的角度看，我觉得你触及了一个很深层的问题。这种思考方式很启发我。'
    ],
    rachel: [
      '你这么说让我想起了很多事。这些年来酒馆里的客人们，其实都在寻找类似的答案。',
      '听你这么说真好。现在很少有人愿意坐下来好好聊这些了，都太匆忙了。',
      '我理解你的感受。在这个什么都变得太快的时代，有些东西确实值得我们停下来想想。',
      '嗯，你说得对。我觉得不管技术怎么发展，人与人之间的真诚交流还是最重要的。'
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

      // 使用Vercel AI Gateway生成回应
      const aiGatewayKey = process.env.AI_GATEWAY_API_KEY;
      console.log('Single chat AI Gateway check:', {
        hasKey: !!aiGatewayKey,
        keyLength: aiGatewayKey ? aiGatewayKey.length : 0,
        character
      });
      
      if (aiGatewayKey) {
        console.log('Using AI Gateway for single chat:', character);
        try {
          const result = await streamText({
            model: 'openai/gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
          });
          
          let fullResponse = '';
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
          }
          
          console.log('AI Gateway single chat response successful for', character, '- length:', fullResponse.length);
          return NextResponse.json({
            response: fullResponse,
            character: character
          });
        } catch (error) {
          console.error('AI Gateway single chat error for', character, ':', error);
          const mockResponse = mockLLMCall(npc.systemPrompt, message);
          return NextResponse.json({
            response: mockResponse,
            character: character
          });
        }
      } else {
        console.log('No AI_GATEWAY_API_KEY found, using mock response for single chat:', character);
        const mockResponse = mockLLMCall(npc.systemPrompt, message);
        return NextResponse.json({
          response: mockResponse,
          character: character
        });
      }
    }
    
    // 群聊模式 - 重新设计的真实朋友式对话
    if (mode === 'group') {
      const topicType = topic?.type || 'general';
      const responseOrder = determineResponseOrder(topicType);
      const groupResponses = [];
      
      // 构建完整的群聊历史上下文（关键：所有NPC都能看到完整对话）
      const fullConversationContext = conversationHistory.map(msg => {
        if (msg.role === 'user') {
          return `用户: ${msg.content}`;
        } else if (msg.character) {
          const charName = characters[msg.character as keyof typeof characters]?.name || msg.character;
          return `${charName}: ${msg.content}`;
        }
        return msg.content;
      }).join('\n');
      
      // 生成主要回应（第一个NPC对用户的回应）
      const firstResponder = responseOrder[0];
      const firstNPC = characters[firstResponder as keyof typeof characters];
      
      // 为第一个回应者构建真实群聊上下文
      const firstGroupContext = `
# 群聊场景
你现在在港口酒馆和朋友们一起聊天。参与者：
- 用户（当前发言者）
- ${characters.alex.name}（数据分析师）
- ${characters.nova.name}（原生AI）  
- ${characters.rachel.name}（酒保）

# 最近的对话历史
${fullConversationContext}

# 当前发言
用户: ${message}

# 你的回应指导
- 你是${firstNPC.name}，请用你的个性和观点自然回应
- 这是朋友间的真实聊天，要听懂上下文
- 可以评论、提问、同意或不同意
- 保持你角色的一致性，但要像真人聊天一样自然`;

      let firstResponse: string;
      
      // 生成第一个回应
      const aiGatewayKey = process.env.AI_GATEWAY_API_KEY;
      if (aiGatewayKey) {
        try {
          const result = await streamText({
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: firstNPC.systemPrompt + firstGroupContext },
              { role: 'user', content: `请回应: ${message}` }
            ],
            temperature: 0.8,
          });
          
          let fullResponse = '';
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
          }
          firstResponse = fullResponse;
          console.log('First group response generated for', firstResponder);
        } catch (error) {
          console.error('AI Gateway error for first responder:', error);
          firstResponse = mockLLMCall(firstNPC.systemPrompt, message);
        }
      } else {
        firstResponse = mockLLMCall(firstNPC.systemPrompt, message);
      }
      
      groupResponses.push({
        character: firstResponder,
        response: firstResponse,
        type: 'primary'
      });
      
      // 更新对话历史，加入第一个回应
      let updatedContext = fullConversationContext + 
        `\n用户: ${message}` +
        `\n${firstNPC.name}: ${firstResponse}`;
      
      // 其他NPC可能会对第一个NPC的回应进行反应
      const remainingNPCs = responseOrder.slice(1);
      
      for (const charId of remainingNPCs) {
        const currentNPC = characters[charId as keyof typeof characters];
        
        // 决定是否回应（基于关系、话题和随机性）
        const shouldRespond = Math.random() < 0.7; // 70%概率回应
        
        if (shouldRespond) {
          // 构建回应上下文，包含刚才的对话
          const responseContext = `
# 群聊场景
你现在在港口酒馆和朋友们聊天。刚才的对话：

${updatedContext}

# 你的回应指导
- 你是${currentNPC.name}，可以：
  * 回应用户的原始问题
  * 对${firstNPC.name}刚才的话发表看法  
  * 提出新的观点或问题
- 要像真正的朋友聊天，自然、连贯
- 保持你的角色个性和观点
- 如果有不同意见，可以友好地讨论`;

          let response: string;
          
          if (aiGatewayKey) {
            try {
              const result = await streamText({
                model: 'openai/gpt-4o-mini',
                messages: [
                  { role: 'system', content: currentNPC.systemPrompt + responseContext },
                  { role: 'user', content: `请自然地参与这个对话` }
                ],
                temperature: 0.8,
              });
              
              let fullResponse = '';
              for await (const chunk of result.textStream) {
                fullResponse += chunk;
              }
              response = fullResponse;
              console.log('Follow-up response generated for', charId);
            } catch (error) {
              console.error('AI Gateway error for follow-up:', error);
              response = mockLLMCall(currentNPC.systemPrompt, message);
            }
          } else {
            response = mockLLMCall(currentNPC.systemPrompt, message);
          }
          
          groupResponses.push({
            character: charId,
            response: response,
            type: 'follow_up'
          });
          
          // 更新上下文，为下一个可能的回应做准备
          updatedContext += `\n${currentNPC.name}: ${response}`;
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