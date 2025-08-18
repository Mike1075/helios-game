/**
 * 全局角色实例管理系统
 * 实现真正的持久化AI角色，每个角色在游戏世界中只有一个实例
 */

import { zepClient } from './zep';

export interface CharacterMemoryContext {
  debts: Array<{player: string, amount: number, item: string, date: number}>;
  orders: Array<{player: string, item: string, status: 'pending' | 'completed', created_at: number}>;
  relationships: Record<string, {
    impression: string;  // 对这个玩家的印象
    trust_level: number; // 信任度 0-10
    interaction_count: number;
    last_seen: number;
  }>;
  important_events: Array<{
    description: string;
    date: number;
    players_involved: string[];
  }>;
}

export interface CharacterInstance {
  id: string;              // "moonlight_tavern_tavern_keeper_001"
  role_template: string;   // "tavern_keeper"
  location: string;        // "moonlight_tavern"
  name: string;            // "老板"
  zep_session_id: string;  // 角色的专属Zep会话ID
  memory_context: CharacterMemoryContext;
  created_at: number;
  last_active: number;
  status: 'active' | 'inactive';
}

class CharacterInstanceManager {
  private static instance: CharacterInstanceManager;
  private globalCharacters = new Map<string, CharacterInstance>();
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): CharacterInstanceManager {
    if (!CharacterInstanceManager.instance) {
      CharacterInstanceManager.instance = new CharacterInstanceManager();
    }
    return CharacterInstanceManager.instance;
  }

  /**
   * 从本地存储加载已存在的角色实例
   */
  private async initializeFromStorage() {
    try {
      // 在实际应用中，这里应该从Supabase加载
      // 目前先从localStorage模拟
      const stored = localStorage.getItem('helios_character_instances');
      if (stored) {
        const instances = JSON.parse(stored);
        for (const instance of instances) {
          this.globalCharacters.set(instance.id, instance);
        }
        console.log(`✅ 加载了 ${instances.length} 个角色实例`);
      }
    } catch (error) {
      console.error('加载角色实例失败:', error);
    }
  }

  /**
   * 保存角色实例到存储
   */
  private async saveToStorage() {
    try {
      const instances = Array.from(this.globalCharacters.values());
      localStorage.setItem('helios_character_instances', JSON.stringify(instances));
      
      // TODO: 同时保存到Supabase
      console.log(`💾 保存了 ${instances.length} 个角色实例`);
    } catch (error) {
      console.error('保存角色实例失败:', error);
    }
  }

  /**
   * 获取或创建全局角色实例
   */
  async getGlobalCharacter(roleTemplate: string, location: string): Promise<CharacterInstance> {
    const key = `${location}_${roleTemplate}`;
    
    if (this.globalCharacters.has(key)) {
      const character = this.globalCharacters.get(key)!;
      character.last_active = Date.now();
      await this.saveToStorage();
      return character;
    }

    // 创建新的角色实例
    return await this.createGlobalCharacter(roleTemplate, location);
  }

  /**
   * 创建新的全局角色实例
   */
  private async createGlobalCharacter(roleTemplate: string, location: string): Promise<CharacterInstance> {
    const timestamp = Date.now();
    const instanceId = `${location}_${roleTemplate}_${timestamp}`;
    const zepSessionId = `character_${instanceId}`;

    // 获取角色基础信息
    const roleInfo = this.getRoleInfo(roleTemplate);
    
    const character: CharacterInstance = {
      id: instanceId,
      role_template: roleTemplate,
      location: location,
      name: roleInfo.name,
      zep_session_id: zepSessionId,
      memory_context: {
        debts: [],
        orders: [],
        relationships: {},
        important_events: []
      },
      created_at: timestamp,
      last_active: timestamp,
      status: 'active'
    };

    // 在Zep中创建角色的专属会话
    await this.initializeCharacterZepSession(character);

    // 保存到内存和存储
    this.globalCharacters.set(character.id, character);
    await this.saveToStorage();

    console.log(`🎭 创建新角色实例: ${character.name} (${character.id})`);
    return character;
  }

  /**
   * 在Zep中初始化角色会话
   */
  private async initializeCharacterZepSession(character: CharacterInstance) {
    try {
      const roleInfo = this.getRoleInfo(character.role_template);
      
      await zepClient.createSession(
        character.zep_session_id,
        `character_${character.role_template}`,
        {
          character_type: 'global_instance',
          role_template: character.role_template,
          location: character.location,
          name: character.name,
          created_at: new Date(character.created_at).toISOString()
        }
      );

      // 添加角色的初始背景信息
      const initialContext = {
        role: 'system' as const,
        content: `你是${character.name}，${roleInfo.description}。你在${character.location}工作/生活。
        
你的个性：${roleInfo.personality}

重要：你是一个持续存在的角色，会记住与每个客人的互动历史。你需要维护与不同客人的关系，记住他们的债务、订单和个人特点。`,
        metadata: {
          type: 'character_initialization',
          character_id: character.id,
          timestamp: character.created_at
        }
      };

      await zepClient.addMessage(character.zep_session_id, initialContext);
      
      console.log(`✅ 初始化角色Zep会话: ${character.name}`);
    } catch (error) {
      console.error(`❌ 初始化角色Zep会话失败: ${character.name}`, error);
    }
  }

  /**
   * 获取角色基础信息
   */
  private getRoleInfo(roleTemplate: string) {
    const roles = {
      'tavern_keeper': {
        name: '老板',
        description: '月影酒馆的老板，经验丰富，见多识广',
        personality: '实用主义，精明但公正，对客人友好但保持商业距离。善于记住每个客人的喜好和欠款情况。'
      },
      'bartender': {
        name: '酒保',
        description: '专业的酒保，熟悉各种酒类',
        personality: '专业友善，是很好的倾听者，偶尔分享人生智慧。记得每个常客喜欢什么酒。'
      },
      'cook': {
        name: '厨师',
        description: '酒馆厨师，专注料理，脾气暴躁但手艺精湛',
        personality: '直率坦诚，对料理充满热情，不喜欢被打扰但乐于分享美食。记得每个客人的口味偏好。'
      },
      'local_resident': {
        name: '当地居民',
        description: '酒馆的常客，对当地情况很了解',
        personality: '健谈友善，喜欢分享当地见闻和小道消息。对熟客更加热情。'
      },
      'guard': {
        name: '守卫',
        description: '维护酒馆秩序的守卫',
        personality: '严肃负责，维护秩序，对可疑行为保持警觉。会记住每个客人的行为表现。'
      }
    };

    return roles[roleTemplate as keyof typeof roles] || {
      name: roleTemplate,
      description: `${roleTemplate}角色`,
      personality: '待定义的角色个性'
    };
  }

  /**
   * 更新角色记忆上下文
   */
  async updateCharacterMemory(
    characterId: string, 
    updateType: 'debt' | 'order' | 'relationship' | 'event',
    data: any
  ) {
    const character = Array.from(this.globalCharacters.values())
      .find(c => c.id === characterId);
    
    if (!character) {
      console.error('角色不存在:', characterId);
      return;
    }

    switch (updateType) {
      case 'debt':
        character.memory_context.debts.push(data);
        break;
      case 'order':
        character.memory_context.orders.push(data);
        break;
      case 'relationship':
        character.memory_context.relationships[data.player] = data.relationship;
        break;
      case 'event':
        character.memory_context.important_events.push(data);
        break;
    }

    character.last_active = Date.now();
    await this.saveToStorage();
  }

  /**
   * 获取角色的记忆摘要（用于AI提示词）
   */
  getCharacterMemorySummary(character: CharacterInstance): string {
    const { memory_context } = character;
    let summary = `你是${character.name}，以下是你的记忆：\n\n`;

    // 债务信息
    if (memory_context.debts.length > 0) {
      summary += `💰 未结账单：\n`;
      for (const debt of memory_context.debts) {
        summary += `- ${debt.player}欠${debt.amount}元(${debt.item})，${new Date(debt.date).toLocaleDateString()}\n`;
      }
      summary += '\n';
    }

    // 订单信息
    const pendingOrders = memory_context.orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
      summary += `📋 进行中的订单：\n`;
      for (const order of pendingOrders) {
        summary += `- ${order.player}的${order.item}，${new Date(order.created_at).toLocaleTimeString()}\n`;
      }
      summary += '\n';
    }

    // 客人关系
    const relationships = Object.entries(memory_context.relationships);
    if (relationships.length > 0) {
      summary += `👥 客人印象：\n`;
      for (const [player, rel] of relationships) {
        summary += `- ${player}: ${rel.impression} (信任度${rel.trust_level}/10, 见过${rel.interaction_count}次)\n`;
      }
      summary += '\n';
    }

    // 重要事件
    if (memory_context.important_events.length > 0) {
      summary += `📝 重要事件：\n`;
      for (const event of memory_context.important_events.slice(-3)) { // 只显示最近3个事件
        summary += `- ${new Date(event.date).toLocaleDateString()}: ${event.description}\n`;
      }
    }

    return summary;
  }

  /**
   * 获取所有活跃角色
   */
  getAllActiveCharacters(): CharacterInstance[] {
    return Array.from(this.globalCharacters.values())
      .filter(c => c.status === 'active');
  }

  /**
   * 清理不活跃的角色实例（可选）
   */
  async cleanupInactiveCharacters(maxInactiveHours: number = 24) {
    const cutoffTime = Date.now() - (maxInactiveHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [key, character] of this.globalCharacters.entries()) {
      if (character.last_active < cutoffTime) {
        character.status = 'inactive';
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveToStorage();
      console.log(`🧹 标记 ${cleaned} 个角色为不活跃状态`);
    }
  }
}

// 导出单例实例
export const characterInstanceManager = CharacterInstanceManager.getInstance();