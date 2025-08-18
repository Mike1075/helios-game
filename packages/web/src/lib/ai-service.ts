/**
 * AI服务 - 统一的AI调用接口
 * 支持通过Vercel AI Gateway调用各种AI模型
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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
   * 调用AI模型生成响应
   */
  async generateResponse(
    messages: AIMessage[],
    model: string = 'gpt-4',
    temperature: number = 0.8,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    try {
      // 方案1: 如果有Vercel AI Gateway配置，使用Gateway
      const gatewayResponse = await this.callVercelGateway(messages, model, temperature, maxTokens);
      if (gatewayResponse) {
        return gatewayResponse;
      }

      // 方案2: 回退到Gemini API
      return await this.callGeminiAPI(messages, temperature, maxTokens);
      
    } catch (error) {
      console.error('AI调用失败:', error);
      throw new Error(`AI服务不可用: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 通过Vercel AI Gateway调用AI
   */
  private async callVercelGateway(
    messages: AIMessage[],
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse | null> {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    const gatewayUrl = process.env.VERCEL_AI_GATEWAY_URL;
    
    if (!apiKey || !gatewayUrl) {
      console.log('🔄 Vercel AI Gateway未配置，尝试其他方式...');
      return null;
    }

    try {
      const response = await fetch(`${gatewayUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gateway响应错误: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage
      };
    } catch (error) {
      console.error('Vercel AI Gateway调用失败:', error);
      return null;
    }
  }

  /**
   * 调用Gemini API
   */
  private async callGeminiAPI(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('未配置Gemini API Key');
    }

    try {
      // 转换消息格式为Gemini格式
      const geminiMessages = this.convertToGeminiFormat(messages);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API响应错误: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API未返回有效响应');
      }

      return {
        content: data.candidates[0].content.parts[0].text,
        model: 'gemini-pro',
        usage: {
          prompt_tokens: 0, // Gemini不提供详细token计数
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      console.error('Gemini API调用失败:', error);
      throw error;
    }
  }

  /**
   * 转换OpenAI格式消息到Gemini格式
   */
  private convertToGeminiFormat(messages: AIMessage[]) {
    return messages
      .filter(msg => msg.role !== 'system') // Gemini不支持system role
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
  }

  /**
   * 生成角色对话响应
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

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: playerMessage
      }
    ];

    try {
      const response = await this.generateResponse(messages, 'gpt-4', 0.8, 500);
      return response.content.trim();
    } catch (error) {
      console.error(`生成${characterName}响应失败:`, error);
      
      // 提供fallback响应
      return this.getFallbackResponse(characterName, playerName);
    }
  }

  /**
   * 当AI调用失败时的备用响应
   */
  private getFallbackResponse(characterName: string, playerName: string): string {
    const fallbacks = {
      '老板': `抱歉，${playerName}，我刚才在想别的事情。能再说一遍吗？`,
      '酒保': `不好意思，${playerName}，刚才在忙着清理酒杯。您需要什么？`,
      '厨师': `嗯...${playerName}，刚才火候要紧，没听清您说什么。`,
      '守卫': `${playerName}，我在巡视，请问有什么事吗？`,
      '当地居民': `哦，${playerName}，我刚才走神了。您说什么？`
    };

    return fallbacks[characterName as keyof typeof fallbacks] || 
           `抱歉，${playerName}，我需要一点时间整理思绪。`;
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();