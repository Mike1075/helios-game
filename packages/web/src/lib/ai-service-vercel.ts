/**
 * AI服务 - 严格按照Mike老师要求使用Vercel AI SDK
 * 使用便宜的Qwen模型替代Gemini
 */

import { generateText } from 'ai';
// 注意：Qwen模型不需要特殊的provider，直接使用模型名称

class AIService {
  private static instance: AIService;
  
  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * 使用Vercel AI SDK生成响应 - 使用便宜的Qwen模型
   */
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    model: string = 'alibaba/qwen-2.5-14b-instruct',
    temperature: number = 0.8,
    maxTokens: number = 1000
  ): Promise<string> {
    try {
      console.log('🤖 使用Vercel AI SDK调用Qwen模型:', model);
      
      // 按照你提供的标准方式，直接使用模型名称
      const result = await generateText({
        model: model, // Qwen模型直接使用字符串
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user', 
            content: userPrompt,
          },
        ],
        temperature: temperature,
        maxTokens: maxTokens,
      });

      console.log('✅ Qwen模型响应生成成功');
      return result.text;
      
    } catch (error) {
      console.error('❌ Qwen模型调用失败:', error);
      
      // 提供降级响应，确保系统不会完全崩溃
      return this.getFallbackResponse(userPrompt);
    }
  }

  /**
   * 生成角色对话响应 - 简化的接口
   */
  async generateCharacterResponse(
    characterName: string,
    characterDescription: string,
    characterMemory: string,
    playerName: string,
    playerMessage: string,
    conversationHistory: string,
    location: string = 'moonlight_tavern'
  ): Promise<string> {
    const systemPrompt = `你是${characterName}，${characterDescription}

地点：${location === 'moonlight_tavern' ? '月影酒馆' : location}

你的记忆和状态：
${characterMemory}

最近的对话历史：
${conversationHistory}

重要规则：
1. 保持角色一致性，体现你的个性和专业知识
2. 记住你与不同客人的关系和历史
3. 只返回你说的话，不要包含动作描述或旁白
4. 如果涉及金钱、订单等，要根据你的记忆准确回应
5. 对老客人要表现出熟悉感，对新客人要适当介绍自己

现在，${playerName}对你说："${playerMessage}"

请自然地回应：`;

    const userPrompt = `${playerName}: ${playerMessage}`;

    try {
      // 使用便宜的Qwen模型，性价比高
      const response = await this.generateResponse(
        systemPrompt, 
        userPrompt, 
        'alibaba/qwen-2.5-14b-instruct',
        0.8, 
        500
      );
      
      return response.trim();
    } catch (error) {
      console.error(`生成${characterName}响应失败:`, error);
      return this.getFallbackResponse(characterName, playerName);
    }
  }

  /**
   * 当AI调用失败时的备用响应
   */
  private getFallbackResponse(input: string, playerName?: string): string {
    if (playerName) {
      // 角色响应的fallback
      const fallbacks = {
        '老板': `抱歉，${playerName}，我刚才在想别的事情。能再说一遍吗？`,
        '酒保': `不好意思，${playerName}，刚才在忙着清理酒杯。您需要什么？`,
        '厨师': `嗯...${playerName}，刚才火候要紧，没听清您说什么。`,
        '守卫': `${playerName}，我在巡视，请问有什么事吗？`,
        '当地居民': `哦，${playerName}，我刚才走神了。您说什么？`,
        '林溪': `${playerName}，抱歉，我在分析一些线索。请重复一下您的话。`,
        '陈浩': `呃...${playerName}，我...我刚才在想别的事情。您说什么？`
      };
      
      return fallbacks[input as keyof typeof fallbacks] || 
             `抱歉，${playerName}，我需要一点时间整理思绪。`;
    }
    
    // 通用fallback
    return '抱歉，我现在无法理解您的意思，请稍后再试。';
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();