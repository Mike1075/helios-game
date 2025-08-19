/**
 * 动态角色管理器
 * 负责检测需求、创建临时角色、管理角色生命周期
 */

import { aiService } from './ai-service';
import { updateCharacterState, saveGameEvent } from './supabase';
import { memoryManager } from './supabase-memory';

export interface DynamicCharacter {
  id: string;
  name: string;
  role: string;
  personality: string;
  background: string;
  appearance: string;
  created_at: number;
  created_by_context: string; // 创建时的上下文
  is_temporary: boolean;
  supabase_session_id: string; // Supabase记忆会话ID
}

export interface CharacterCreationContext {
  userMessage: string;
  sceneId: string;
  existingCharacters: string[];
  playerName: string;
}

class DynamicCharacterManager {
  private static instance: DynamicCharacterManager;
  private activeCharacters: Map<string, DynamicCharacter> = new Map();

  private constructor() {}

  static getInstance(): DynamicCharacterManager {
    if (!DynamicCharacterManager.instance) {
      DynamicCharacterManager.instance = new DynamicCharacterManager();
    }
    return DynamicCharacterManager.instance;
  }

  /**
   * 分析用户消息，判断是否需要创建新角色
   */
  async analyzeNeedForNewCharacter(context: CharacterCreationContext): Promise<{
    needsCharacter: boolean;
    characterType?: string;
    reasoning?: string;
  }> {
    try {
      const analysisPrompt = `分析以下对话，判断是否需要一个新的NPC角色来回应：

用户消息："${context.userMessage}"
场景：月影酒馆
现有角色：${context.existingCharacters.join(', ')}

分析规则：
1. 如果用户询问服务、设施、信息等，可能需要相关角色
2. 如果用户寻找特定职业的人，需要创建该角色
3. 如果现有角色已能处理，则不需要新角色

返回JSON格式：
{
  "needsCharacter": true/false,
  "characterType": "老板/服务员/当地人/其他",
  "reasoning": "分析理由"
}`;

      const response = await aiService.generateResponse([
        { role: 'system', content: '你是专业的游戏角色需求分析师。' },
        { role: 'user', content: analysisPrompt }
      ]);

      // 解析AI响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { needsCharacter: false };
    } catch (error) {
      console.error('角色需求分析失败:', error);
      return { needsCharacter: false };
    }
  }

  /**
   * 智能分析并创建最合适的角色
   */
  async createCharacterByAnalysis(context: CharacterCreationContext): Promise<DynamicCharacter | null> {
    try {
      const analysisPrompt = `分析用户消息，确定在月影酒馆中最适合回应的角色类型：

用户消息："${context.userMessage}"
玩家：${context.playerName}
场景：月影酒馆 - 一个神秘而温馨的酒馆
现有角色：${context.existingCharacters.length > 0 ? context.existingCharacters.join(', ') : '无'}

请分析用户的需求和语境，返回JSON格式：
{
  "characterType": "老板/酒保/服务员/厨师/当地人/过路人/神秘客人",
  "reasoning": "选择这个角色的原因",
  "urgency": 1-5
}

分析考虑：
1. 用户的具体需求（如询问信息、寻求服务、闲聊等）
2. 最能提供帮助或互动的角色类型
3. 酒馆场景的合理性
4. 如果是一般性问候，选择最合适的接待角色

现在分析：`;

      const response = await aiService.generateResponse([
        { role: 'system', content: '你是专业的角色需求分析师，善于根据用户需求匹配最合适的NPC角色。' },
        { role: 'user', content: analysisPrompt }
      ]);

      // 解析AI响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // 如果AI分析失败，使用默认的酒保
        console.warn('AI角色分析失败，使用默认酒保');
        return await this.createCharacterForContext(context, '酒保');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log('🤖 AI角色分析结果:', analysis);

      // 使用分析结果创建角色
      return await this.createCharacterForContext(context, analysis.characterType);

    } catch (error) {
      console.error('智能角色分析失败:', error);
      // 回退到默认酒保
      return await this.createCharacterForContext(context, '酒保');
    }
  }

  /**
   * 根据上下文创建新角色
   */
  async createCharacterForContext(context: CharacterCreationContext, characterType: string): Promise<DynamicCharacter | null> {
    try {
      const creationPrompt = `为月影酒馆创建一个${characterType}角色：

背景：月影酒馆是一个神秘而温馨的酒馆，常有各种人来往
需求：用户说"${context.userMessage}"，需要一个${characterType}来回应
现有角色：${context.existingCharacters.join(', ')}

请创建一个独特的角色，返回JSON格式：
{
  "name": "角色姓名",
  "role": "${characterType}",
  "personality": "性格特点（3-4个词）",
  "background": "简短背景（1-2句话）",
  "appearance": "外观描述（1-2句话）"
}

要求：
- 姓名要符合中文语境，独特但不奇怪
- 性格要丰富立体，避免脸谱化
- 背景要合理，与酒馆环境契合`;

      const response = await aiService.generateResponse([
        { role: 'system', content: '你是专业的游戏角色设计师，擅长创造生动有趣的NPC角色。' },
        { role: 'user', content: creationPrompt }
      ]);

      // 解析AI响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI响应格式错误');
      }

      const characterData = JSON.parse(jsonMatch[0]);
      
      // 创建角色对象
      const character: DynamicCharacter = {
        id: `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: characterData.name,
        role: characterData.role,
        personality: characterData.personality,
        background: characterData.background,
        appearance: characterData.appearance,
        created_at: Date.now(),
        created_by_context: context.userMessage,
        is_temporary: true,
        supabase_session_id: `memory_${characterData.name.toLowerCase()}_${Date.now()}`
      };

      // 保存到活跃角色列表
      this.activeCharacters.set(character.id, character);

      // 初始化角色状态到数据库
      await this.initializeCharacterState(character);

      // 记录角色创建事件
      await saveGameEvent({
        character_id: 'system',
        event_type: 'action',
        content: `${character.name}（${character.role}）来到了酒馆`,
        timestamp: Date.now(),
        scene_id: context.sceneId,
        metadata: {
          character_creation: true,
          created_character: character.id,
          created_by_context: context.userMessage
        }
      });

      console.log(`✨ 创建新角色: ${character.name}（${character.role}）`);
      return character;

    } catch (error) {
      console.error('创建角色失败:', error);
      return null;
    }
  }

  /**
   * 初始化角色状态到数据库
   */
  private async initializeCharacterState(character: DynamicCharacter): Promise<void> {
    try {
      await updateCharacterState({
        character_id: character.id,
        energy: 70 + Math.random() * 20, // 70-90
        focus: 60 + Math.random() * 30,  // 60-90
        curiosity: 40 + Math.random() * 40, // 40-80
        boredom: 10 + Math.random() * 20, // 10-30
        anxiety: 20 + Math.random() * 30, // 20-50
        suspicion: 30 + Math.random() * 20, // 30-50
        last_updated: Date.now()
      });
    } catch (error) {
      console.warn(`初始化${character.name}状态失败:`, error);
    }
  }

  /**
   * 获取角色响应（为动态角色生成对话）
   */
  async generateCharacterResponse(
    character: DynamicCharacter,
    playerName: string,
    playerMessage: string
  ): Promise<string> {
    try {
      // 从记忆系统获取对话历史和角色记忆
      const conversationHistory = await memoryManager.getConversationHistory(character.id, 10);
      const memorySummary = await memoryManager.getMemorySummary(character.id);
      
      const systemPrompt = `你是${character.name}，${character.role}。

角色设定：
- 性格：${character.personality}
- 背景：${character.background}
- 外观：${character.appearance}

场景：月影酒馆
创建原因：有人说"${character.created_by_context}"，所以你出现了

你的记忆：
${memorySummary}

最近对话历史：
${conversationHistory}

重要规则：
1. 保持角色一致性，体现你的性格特点
2. 记住你是刚刚"出现"的，可以自然地解释你的存在
3. 只返回对话内容，不要包含动作描述
4. 根据创建背景和你的记忆，提供相应的帮助或信息
5. 如果与某人有互动历史，要体现出来

现在，${playerName}对你说："${playerMessage}"

请自然地回应：`;

      const response = await aiService.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: playerMessage }
      ]);

      const aiResponse = response.content.trim();

      // 保存对话到记忆系统
      await memoryManager.saveConversation(character.id, [
        {
          role: 'user',
          content: playerMessage,
          character_id: character.id,
          player_name: playerName,
          timestamp: Date.now()
        },
        {
          role: 'assistant',
          content: aiResponse,
          character_id: character.id,
          timestamp: Date.now()
        }
      ]);

      return aiResponse;
    } catch (error) {
      console.error(`生成${character.name}响应失败:`, error);
      return `抱歉，${playerName}，我需要一点时间整理思绪。`;
    }
  }

  /**
   * 获取所有活跃角色
   */
  getActiveCharacters(): DynamicCharacter[] {
    return Array.from(this.activeCharacters.values());
  }

  /**
   * 根据ID获取角色
   */
  getCharacterById(characterId: string): DynamicCharacter | undefined {
    return this.activeCharacters.get(characterId);
  }

  /**
   * 检查角色是否已存在（避免重复创建）
   */
  findCharacterByRole(role: string): DynamicCharacter | undefined {
    return Array.from(this.activeCharacters.values())
      .find(char => char.role.includes(role) || role.includes(char.role));
  }

  /**
   * 移除不活跃的角色（可选功能）
   */
  async cleanupInactiveCharacters(maxInactiveHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxInactiveHours * 60 * 60 * 1000);
    const toRemove: string[] = [];

    this.activeCharacters.forEach((character, id) => {
      if (character.created_at < cutoffTime) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => {
      const character = this.activeCharacters.get(id);
      if (character) {
        console.log(`🧹 移除不活跃角色: ${character.name}`);
        this.activeCharacters.delete(id);
      }
    });
  }
}

// 导出单例实例
export const dynamicCharacterManager = DynamicCharacterManager.getInstance();