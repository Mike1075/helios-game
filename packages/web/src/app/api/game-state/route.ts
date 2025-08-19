/**
 * 统一游戏状态API - v5.0架构核心
 * 
 * 单一入口点处理所有游戏操作：
 * - 角色对话和创建
 * - 事件记录和获取  
 * - 回响之室触发
 * - 游戏状态管理
 * 
 * 解决问题：消除401/400错误，统一角色管理，简化前端逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { aiService } from '@/lib/ai-service';
import { getChatHistory, savePlayerMessage, saveAIResponse } from '@/lib/zep';

// 核心角色定义 - 永远存在的NPC
const CORE_CHARACTERS = [
  { 
    id: 'linxi', 
    name: '林溪', 
    type: 'core_npc' as const,
    role: '神秘调查员',
    personality: '敏锐、独立、对真相有执着的追求',
    source: 'predefined' as const
  },
  { 
    id: 'chenhao', 
    name: '陈浩', 
    type: 'core_npc' as const,
    role: '温和酒保',
    personality: '友善、容易相信他人、避免冲突',
    source: 'predefined' as const
  }
];

// 游戏状态管理器
class GameStateManager {
  
  /**
   * 获取所有角色列表
   */
  async getCharacters() {
    try {
      // 获取动态创建的角色
      const { data: dynamicChars, error } = await supabaseAdmin
        .from('scene_events')
        .select('metadata')
        .eq('event_type', 'character_created')
        .not('metadata', 'is', null);

      if (error) {
        console.error('获取动态角色失败:', error);
      }

      // 解析动态角色
      const dynamicCharacters = dynamicChars?.map(event => ({
        id: event.metadata.character_id,
        name: event.metadata.character_name,
        type: 'dynamic_npc' as const,
        role: event.metadata.role || '酒馆客人',
        source: 'ai_created' as const
      })) || [];

      // 合并核心角色和动态角色
      return [...CORE_CHARACTERS, ...dynamicCharacters];
    } catch (error) {
      console.error('角色管理器错误:', error);
      return CORE_CHARACTERS;
    }
  }

  /**
   * 获取最近的游戏事件
   */
  async getRecentEvents(limit = 20) {
    try {
      const { data: events, error } = await supabaseAdmin
        .from('scene_events')
        .select('*')
        .eq('scene_id', 'moonlight_tavern')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return events?.reverse() || [];
    } catch (error) {
      console.error('获取事件失败:', error);
      return [];
    }
  }

  /**
   * 处理玩家聊天消息
   */
  async handleChat(playerName: string, userMessage: string, sessionId: string, inputType: string) {
    try {
      console.log('🎯 统一聊天处理:', { playerName, message: userMessage.slice(0, 50) });

      // 1. 保存玩家消息
      await savePlayerMessage(sessionId, playerName, userMessage, inputType === 'action' ? 'action' : 'dialogue');

      // 2. 智能路由 - 简化版本
      const shouldCreateNewCharacter = this.shouldCreateNewCharacter(userMessage, playerName);
      let responseCharacter;
      let aiResponse;

      if (shouldCreateNewCharacter) {
        // 创建新角色并响应
        responseCharacter = await this.createDynamicCharacter(userMessage, playerName);
        aiResponse = await this.generateCharacterResponse(responseCharacter, playerName, userMessage, sessionId);
      } else {
        // 使用现有角色响应
        responseCharacter = this.selectBestCharacter(userMessage, playerName);
        aiResponse = await this.generateCharacterResponse(responseCharacter, playerName, userMessage, sessionId);
      }

      // 3. 保存AI响应
      await saveAIResponse(sessionId, responseCharacter.id, aiResponse);

      // 4. 记录事件
      await this.recordChatEvent(responseCharacter, aiResponse, userMessage, playerName);

      return {
        success: true,
        character: responseCharacter,
        response: aiResponse,
        new_character_created: shouldCreateNewCharacter
      };

    } catch (error) {
      console.error('聊天处理失败:', error);
      throw error;
    }
  }

  /**
   * 判断是否需要创建新角色
   */
  private shouldCreateNewCharacter(userMessage: string, playerName: string): boolean {
    // 简单规则：如果玩家直接询问新的人或要求特定服务
    const newCharacterTriggers = [
      '服务员', '老板', '厨师', '客人', '有人', '请问谁', '找个人'
    ];
    
    return newCharacterTriggers.some(trigger => userMessage.includes(trigger));
  }

  /**
   * 选择最适合的现有角色
   */
  private selectBestCharacter(userMessage: string, playerName: string) {
    // 简单规则：默认选择林溪，除非明确指向陈浩
    if (userMessage.includes('酒保') || userMessage.includes('陈浩') || userMessage.includes('酒')) {
      return CORE_CHARACTERS.find(c => c.id === 'chenhao')!;
    }
    
    return CORE_CHARACTERS.find(c => c.id === 'linxi')!;
  }

  /**
   * 创建动态角色
   */
  private async createDynamicCharacter(userMessage: string, playerName: string) {
    // 基于用户消息创建合适的角色
    let characterType = '服务员';
    let characterName = '小李';
    
    if (userMessage.includes('老板')) {
      characterType = '老板';
      characterName = '老王';
    } else if (userMessage.includes('厨师')) {
      characterType = '厨师';
      characterName = '阿明';
    }

    const newCharacter = {
      id: `dynamic_${Date.now()}`,
      name: characterName,
      type: 'dynamic_npc' as const,
      role: characterType,
      personality: '友善、专业',
      source: 'ai_created' as const
    };

    // 记录角色创建事件
    await supabaseAdmin
      .from('scene_events')
      .insert({
        id: `char_create_${Date.now()}`,
        scene_id: 'moonlight_tavern',
        character_id: 'system',
        event_type: 'character_created',
        content: `${characterName}出现在酒馆中`,
        timestamp: Date.now(),
        metadata: {
          character_id: newCharacter.id,
          character_name: newCharacter.name,
          role: newCharacter.role,
          created_by: playerName
        }
      });

    console.log('✨ 创建新角色:', newCharacter);
    return newCharacter;
  }

  /**
   * 生成角色响应
   */
  private async generateCharacterResponse(character: any, playerName: string, userMessage: string, sessionId: string): Promise<string> {
    try {
      const conversationHistory = await getChatHistory(sessionId, 10);
      
      if (character.type === 'core_npc') {
        // 核心NPC使用专业AI服务 - generateCharacterResponse 已经返回字符串
        const response = await aiService.generateCharacterResponse(
          character.name,
          `${character.role}，${character.personality}`,
          '',
          playerName,
          userMessage,
          conversationHistory,
          'moonlight_tavern'
        );
        
        return response; // generateCharacterResponse 已经返回 Promise<string>
        
      } else {
        // 动态角色使用简单响应
        const systemPrompt = `你是月影酒馆的${character.role}${character.name}。你${character.personality}。请简短自然地回应客人${playerName}的话。`;
        
        const response = await aiService.generateResponse([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]);
        
        // 处理AI服务的响应格式
        if (typeof response === 'object' && response.content) {
          return response.content;
        } else if (typeof response === 'string') {
          return response;
        }
        return `${character.name}友好地点了点头。`;
      }
    } catch (error) {
      console.error('AI响应生成失败:', error);
      // 返回备用响应
      return `${character.name}沉思了一下，暂时没有回应。`;
    }
  }

  /**
   * 记录聊天事件
   */
  private async recordChatEvent(character: any, response: string, userMessage: string, playerName: string) {
    await supabaseAdmin
      .from('scene_events')
      .insert({
        id: `chat_${Date.now()}`,
        scene_id: 'moonlight_tavern',
        character_id: character.id,
        event_type: 'dialogue',
        content: response,
        timestamp: Date.now(),
        metadata: {
          player_message: userMessage,
          player_name: playerName,
          character_type: character.type
        }
      });
  }

  /**
   * 触发回响之室
   */
  async triggerChamberOfEchoes(playerId: string, playerName: string, triggerContext?: string) {
    try {
      // 实现回响之室逻辑
      console.log('🔮 触发回响之室:', { playerId, playerName });
      
      // 这里可以调用原有的回响之室逻辑
      return {
        success: true,
        message: '回响之室已触发',
        chamber_invitation: {
          player_id: playerId,
          trigger_context: triggerContext || '你感到了某种内心的冲突...'
        }
      };
    } catch (error) {
      console.error('回响之室触发失败:', error);
      throw error;
    }
  }
}

// 创建全局游戏状态管理器实例
const gameStateManager = new GameStateManager();

/**
 * 统一游戏状态API处理函数
 */
export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();
    
    console.log('🎮 游戏状态API调用:', { action, payload: Object.keys(payload || {}) });

    switch (action) {
      case 'chat':
        const chatResult = await gameStateManager.handleChat(
          payload.playerName,
          payload.userMessage,
          payload.sessionId,
          payload.inputType
        );
        return NextResponse.json(chatResult);

      case 'get_characters':
        const characters = await gameStateManager.getCharacters();
        return NextResponse.json({ success: true, characters });

      case 'get_events':
        const events = await gameStateManager.getRecentEvents(payload.limit);
        return NextResponse.json({ success: true, events });

      case 'get_game_state':
        const [charactersState, eventsState] = await Promise.all([
          gameStateManager.getCharacters(),
          gameStateManager.getRecentEvents(20)
        ]);
        return NextResponse.json({ 
          success: true, 
          gameState: {
            characters: charactersState,
            events: eventsState,
            scene_id: 'moonlight_tavern'
          }
        });

      case 'trigger_chamber':
        const chamberResult = await gameStateManager.triggerChamberOfEchoes(
          payload.playerId,
          payload.playerName,
          payload.triggerContext
        );
        return NextResponse.json(chamberResult);

      default:
        return NextResponse.json(
          { success: false, error: `未知操作: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ 游戏状态API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `游戏状态处理失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * 获取API状态信息
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Unified Game State API v5.0',
    architecture: 'Single Point of Entry',
    actions: [
      'chat - 处理玩家聊天消息',
      'get_characters - 获取所有角色',
      'get_events - 获取最近事件',
      'get_game_state - 获取完整游戏状态',
      'trigger_chamber - 触发回响之室'
    ],
    features: [
      '统一角色管理',
      '智能角色路由',
      '动态角色创建',
      '统一数据库访问',
      '消除401/400错误'
    ]
  });
}