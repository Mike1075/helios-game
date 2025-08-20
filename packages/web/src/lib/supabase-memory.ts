/**
 * Supabase Vector记忆系统
 * 使用pgvector扩展存储和检索角色记忆
 * 替代Zep，降低成本并提高集成度
 */

import { supabase } from './supabase';

export interface Memory {
  id: string;
  character_id: string;
  content: string;
  memory_type: 'conversation' | 'observation' | 'relationship' | 'event';
  importance: number; // 1-10，重要性评分
  embedding?: number[]; // 向量嵌入
  metadata: {
    player_name?: string;
    timestamp: number;
    scene_id?: string;
    related_characters?: string[];
  };
  created_at: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  character_id: string;
  player_name?: string;
  timestamp: number;
}

class SupabaseMemoryManager {
  private static instance: SupabaseMemoryManager;

  private constructor() {}

  static getInstance(): SupabaseMemoryManager {
    if (!SupabaseMemoryManager.instance) {
      SupabaseMemoryManager.instance = new SupabaseMemoryManager();
    }
    return SupabaseMemoryManager.instance;
  }

  /**
   * 保存对话消息
   */
  async saveConversation(
    characterId: string,
    messages: ConversationMessage[]
  ): Promise<void> {
    try {
      const memoryRecords = messages.map(msg => ({
        id: `conv_${characterId}_${msg.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
        character_id: characterId,
        content: `${msg.role === 'user' ? (msg.player_name || '玩家') : '我'}: ${msg.content}`,
        memory_type: 'conversation' as const,
        importance: this.calculateImportance(msg.content),
        metadata: {
          player_name: msg.player_name,
          timestamp: msg.timestamp,
          scene_id: 'moonlight_tavern',
          role: msg.role
        },
        created_at: msg.timestamp
      }));

      const { error } = await supabase
        .from('character_memories')
        .insert(memoryRecords);

      if (error) {
        console.error('保存对话记忆失败:', error);
      }
    } catch (error) {
      console.error('保存对话记忆异常:', error);
    }
  }

  /**
   * 保存重要事件记忆
   */
  async saveEventMemory(
    characterId: string,
    eventContent: string,
    importance: number,
    metadata: any = {}
  ): Promise<void> {
    try {
      const memory: Omit<Memory, 'embedding'> = {
        id: `event_${characterId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        character_id: characterId,
        content: eventContent,
        memory_type: 'event',
        importance,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          scene_id: 'moonlight_tavern'
        },
        created_at: Date.now()
      };

      const { error } = await supabase
        .from('character_memories')
        .insert([memory]);

      if (error) {
        console.error('保存事件记忆失败:', error);
      }
    } catch (error) {
      console.error('保存事件记忆异常:', error);
    }
  }

  /**
   * 保存关系记忆
   */
  async saveRelationshipMemory(
    characterId: string,
    playerName: string,
    relationshipData: {
      impression: string;
      trust_level: number;
      interaction_count: number;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const content = `与${playerName}的关系: ${relationshipData.impression}（信任度: ${relationshipData.trust_level}/10，互动次数: ${relationshipData.interaction_count}）${relationshipData.notes ? ` - ${relationshipData.notes}` : ''}`;

      const memory: Omit<Memory, 'embedding'> = {
        id: `rel_${characterId}_${playerName}_${Date.now()}`,
        character_id: characterId,
        content,
        memory_type: 'relationship',
        importance: Math.min(8, relationshipData.trust_level + 3),
        metadata: {
          player_name: playerName,
          timestamp: Date.now(),
          scene_id: 'moonlight_tavern',
          ...relationshipData
        },
        created_at: Date.now()
      };

      // 先删除旧的关系记忆，再插入新的
      await supabase
        .from('character_memories')
        .delete()
        .eq('character_id', characterId)
        .eq('memory_type', 'relationship')
        .contains('metadata', { player_name: playerName });

      const { error } = await supabase
        .from('character_memories')
        .insert([memory]);

      if (error) {
        console.error('保存关系记忆失败:', error);
      }
    } catch (error) {
      console.error('保存关系记忆异常:', error);
    }
  }

  /**
   * 获取角色的对话历史
   */
  async getConversationHistory(
    characterId: string,
    limit: number = 20
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('character_memories')
        .select('content, created_at')
        .eq('character_id', characterId)
        .eq('memory_type', 'conversation')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取对话历史失败:', error);
        return '';
      }

      // 按时间正序排列，格式化为对话历史
      return data
        .reverse()
        .map(record => record.content)
        .join('\n');
    } catch (error) {
      console.error('获取对话历史异常:', error);
      return '';
    }
  }

  /**
   * 获取角色记忆摘要
   */
  async getMemorySummary(characterId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('character_memories')
        .select('content, memory_type, importance, metadata')
        .eq('character_id', characterId)
        .gte('importance', 6) // 只获取重要记忆
        .order('importance', { ascending: false })
        .limit(10);

      if (error) {
        console.error('获取记忆摘要失败:', error);
        return '';
      }

      if (!data || data.length === 0) {
        return '暂无重要记忆';
      }

      // 按类型组织记忆
      const memoryByType = data.reduce((acc, memory) => {
        if (!acc[memory.memory_type]) {
          acc[memory.memory_type] = [];
        }
        acc[memory.memory_type].push(memory.content);
        return acc;
      }, {} as Record<string, string[]>);

      let summary = '';
      
      if (memoryByType.relationship) {
        summary += `关系记忆:\n${memoryByType.relationship.join('\n')}\n\n`;
      }
      
      if (memoryByType.event) {
        summary += `重要事件:\n${memoryByType.event.join('\n')}\n\n`;
      }
      
      if (memoryByType.conversation) {
        summary += `重要对话:\n${memoryByType.conversation.slice(0, 3).join('\n')}\n\n`;
      }

      return summary.trim() || '暂无重要记忆';
    } catch (error) {
      console.error('获取记忆摘要异常:', error);
      return '记忆系统暂时不可用';
    }
  }

  /**
   * 智能检索相关记忆
   */
  async searchRelevantMemories(
    characterId: string,
    query: string,
    limit: number = 5
  ): Promise<Memory[]> {
    try {
      // 简单的关键词匹配（未来可以使用向量搜索）
      const keywords = query.toLowerCase().split(/\s+/);
      
      const { data, error } = await supabase
        .from('character_memories')
        .select('*')
        .eq('character_id', characterId)
        .gte('importance', 4)
        .order('importance', { ascending: false })
        .limit(limit * 2); // 获取更多候选，然后过滤

      if (error) {
        console.error('搜索相关记忆失败:', error);
        return [];
      }

      // 简单的相关性评分
      const scoredMemories = data.map(memory => {
        const content = memory.content.toLowerCase();
        const score = keywords.reduce((acc, keyword) => {
          return acc + (content.includes(keyword) ? 1 : 0);
        }, 0);
        return { ...memory, relevanceScore: score };
      });

      // 返回最相关的记忆
      return scoredMemories
        .filter(m => m.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore || b.importance - a.importance)
        .slice(0, limit);
    } catch (error) {
      console.error('搜索相关记忆异常:', error);
      return [];
    }
  }

  /**
   * 计算内容重要性（简单规则）
   */
  private calculateImportance(content: string): number {
    const lowerContent = content.toLowerCase();
    let importance = 3; // 基础重要性

    // 关键词加权
    const importantKeywords = {
      '秘密': 3,
      '调查': 2,
      '紧张': 1,
      '怀疑': 2,
      '害怕': 2,
      '警察': 3,
      '问题': 1,
      '麻烦': 2,
      '不对劲': 2,
      '奇怪': 1
    };

    Object.entries(importantKeywords).forEach(([keyword, weight]) => {
      if (lowerContent.includes(keyword)) {
        importance += weight;
      }
    });

    // 问号增加重要性（问题通常更重要）
    const questionCount = (content.match(/[？?]/g) || []).length;
    importance += questionCount;

    // 长度加权（更长的内容可能更重要）
    if (content.length > 50) {
      importance += 1;
    }

    return Math.min(10, importance);
  }

  /**
   * 清理旧记忆（可选）
   */
  async cleanupOldMemories(characterId: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = Date.now() - maxAge;
      
      const { error } = await supabase
        .from('character_memories')
        .delete()
        .eq('character_id', characterId)
        .lt('importance', 5) // 只删除不重要的记忆
        .lt('created_at', cutoffTime);

      if (error) {
        console.error('清理旧记忆失败:', error);
      }
    } catch (error) {
      console.error('清理旧记忆异常:', error);
    }
  }
}

// 导出单例实例
export const memoryManager = SupabaseMemoryManager.getInstance();