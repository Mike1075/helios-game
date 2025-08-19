/**
 * 被动观察体验管理器
 * 让玩家即使不主动参与，也能感受到活跃的世界
 */

import { supabase, saveGameEvent } from './supabase';
import { realtimeManager } from './realtime-subscription';
import { dynamicCharacterManager } from './dynamic-character-manager';

export interface InitialGameState {
  sceneDescription: string;
  activeCharacters: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    isCore: boolean;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    character_name: string;
    content: string;
    timestamp: number;
    is_autonomous: boolean;
  }>;
  ambientActivity: string[];
}

class PassiveObserverManager {
  private static instance: PassiveObserverManager;

  private constructor() {}

  static getInstance(): PassiveObserverManager {
    if (!PassiveObserverManager.instance) {
      PassiveObserverManager.instance = new PassiveObserverManager();
    }
    return PassiveObserverManager.instance;
  }

  /**
   * 加载初始游戏状态
   */
  async loadInitialGameState(sceneId: string = 'moonlight_tavern'): Promise<InitialGameState> {
    try {
      // 1. 生成场景描述
      const sceneDescription = await this.generateSceneDescription(sceneId);

      // 2. 获取活跃角色
      const activeCharacters = await this.getActiveCharacters(sceneId);

      // 3. 获取最近的公开事件
      const recentEvents = await this.getRecentPublicEvents(sceneId, 10);

      // 4. 生成环境活动
      const ambientActivity = await this.generateAmbientActivity(sceneId);

      return {
        sceneDescription,
        activeCharacters,
        recentEvents,
        ambientActivity
      };
    } catch (error) {
      console.error('加载初始游戏状态失败:', error);
      return this.getDefaultGameState();
    }
  }

  /**
   * 生成动态场景描述
   */
  private async generateSceneDescription(sceneId: string): Promise<string> {
    const baseDescriptions = {
      moonlight_tavern: `月影酒馆在夜幕中静静营业，昏暗的灯光透过雾气投下摇曳的影子。厚重的木制桌椅散发着岁月的痕迹，空气中弥漫着酒精、烟草和木材的混合味道。角落里的壁炉温暖地燃烧着，为这个神秘的地方增添了一丝温馨的气息。`
    };

    // 基础描述
    let description = baseDescriptions[sceneId as keyof typeof baseDescriptions] || '一个神秘的地方';

    // 添加动态元素
    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour <= 6) {
      description += ` 夜晚的酒馆显得格外宁静，偶尔传来远处的脚步声和低声的交谈。`;
    } else {
      description += ` 白日的酒馆相对安静，阳光透过窗户洒在木桌上，营造出一种慵懒的氛围。`;
    }

    return description;
  }

  /**
   * 获取活跃角色状态
   */
  private async getActiveCharacters(sceneId: string): Promise<InitialGameState['activeCharacters']> {
    const characters: InitialGameState['activeCharacters'] = [];

    // 核心角色（林溪、陈浩）
    const coreCharacters = [
      { id: 'linxi', name: '林溪', role: '调查员' },
      { id: 'chenhao', name: '陈浩', role: '年轻人' }
    ];

    for (const char of coreCharacters) {
      characters.push({
        ...char,
        status: await this.getCharacterStatus(char.id),
        isCore: true
      });
    }

    // 动态角色
    const dynamicChars = dynamicCharacterManager.getActiveCharacters();
    for (const char of dynamicChars) {
      characters.push({
        id: char.id,
        name: char.name,
        role: char.role,
        status: await this.getCharacterStatus(char.id),
        isCore: false
      });
    }

    return characters;
  }

  /**
   * 获取角色状态描述
   */
  private async getCharacterStatus(characterId: string): Promise<string> {
    console.log('📊 重新启用角色状态查询');
    
    try {
      const { data, error } = await supabase
        .from('character_states')
        .select('energy, boredom, anxiety, suspicion')
        .eq('character_id', characterId)
        .single();

      if (error || !data) {
        return '状态未知';
      }

      // 根据状态数值生成描述
      const { energy, boredom, anxiety, suspicion } = data;
      
      if (energy > 70) {
        return '精神饱满';
      } else if (energy < 30) {
        return '显得疲惫';
      } else if (boredom > 70) {
        return '看起来无聊';
      } else if (anxiety > 70) {
        return '似乎有些紧张';
      } else if (suspicion > 70) {
        return '警觉地观察着';
      } else {
        return '安静地坐着';
      }
    } catch (error) {
      console.error(`获取${characterId}状态失败:`, error);
      return '状态未知';
    }
  }

  /**
   * 获取最近的公开事件
   */
  private async getRecentPublicEvents(sceneId: string, limit: number): Promise<InitialGameState['recentEvents']> {
    try {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

      const { data, error } = await supabase
        .from('scene_events')
        .select('id, event_type, character_id, content, timestamp, is_autonomous')
        .eq('scene_id', sceneId)
        .gte('timestamp', tenMinutesAgo)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取最近事件失败:', error);
        return [];
      }

      // 转换格式并添加角色名称
      return (data || []).map(event => ({
        id: event.id,
        type: event.event_type,
        character_name: this.getCharacterName(event.character_id),
        content: event.content,
        timestamp: event.timestamp,
        is_autonomous: event.is_autonomous || false
      })).reverse(); // 按时间正序
    } catch (error) {
      console.error('获取最近事件异常:', error);
      return [];
    }
  }

  /**
   * 根据角色ID获取角色名称
   * 根据用户反馈，动态角色应显示职能而不是个人姓名
   */
  private getCharacterName(characterId: string): string {
    const nameMap: Record<string, string> = {
      'linxi': '林溪',
      'chenhao': '陈浩',
      'system': '系统',
      'environment': '环境'
    };

    // 检查是否是动态角色
    const dynamicChar = dynamicCharacterManager.getCharacterById(characterId);
    if (dynamicChar) {
      // 显示更友好的名称：职能+姓名
      return `${dynamicChar.role} ${dynamicChar.name}`;
    }

    return nameMap[characterId] || characterId;
  }

  /**
   * 生成环境活动
   */
  private async generateAmbientActivity(sceneId: string): Promise<string[]> {
    const activities = [
      '远处传来低沉的交谈声',
      '酒杯轻微碰撞的声音',
      '壁炉中木材燃烧的轻微爆裂声',
      '门外偶尔传来的脚步声',
      '微风轻抚窗户的声音',
      '酒馆深处传来的翻页声',
      '某人轻轻咳嗽的声音'
    ];

    // 随机选择2-4个活动
    const selectedCount = 2 + Math.floor(Math.random() * 3);
    const shuffled = activities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, selectedCount);
  }

  /**
   * 设置被动观察体验
   */
  async setupPassiveObservation(playerId: string, sceneId: string, callbacks: {
    onInitialState?: (state: InitialGameState) => void;
    onSceneEvent?: (event: any) => void;
    onCharacterStateChange?: (state: any) => void;
  }): Promise<() => void> {
    // 1. 加载初始状态
    const initialState = await this.loadInitialGameState(sceneId);
    if (callbacks.onInitialState) {
      callbacks.onInitialState(initialState);
    }

    // 2. 设置实时订阅
    realtimeManager.enterScene(sceneId, playerId);

    // 3. 注册事件回调
    const unsubscribeScene = realtimeManager.onSceneEvent((event) => {
      if (event.character_id !== playerId && callbacks.onSceneEvent) {
        callbacks.onSceneEvent({
          id: event.id,
          type: event.event_type,
          character_name: this.getCharacterName(event.character_id),
          content: event.content,
          timestamp: event.timestamp,
          is_autonomous: event.is_autonomous
        });
      }
    });

    const unsubscribeCharacter = realtimeManager.onCharacterState((state) => {
      if (callbacks.onCharacterStateChange) {
        callbacks.onCharacterStateChange({
          character_id: state.character_id,
          character_name: this.getCharacterName(state.character_id),
          status: this.interpretStateChange(state)
        });
      }
    });

    // 4. 发布玩家进入事件
    await saveGameEvent({
      character_id: 'system',
      event_type: 'action',
      content: `${playerId} 静静地进入了酒馆，在角落找了个位置坐下`,
      timestamp: Date.now(),
      scene_id: sceneId,
      metadata: {
        player_entrance: true,
        passive_observation: true
      }
    });

    // 返回清理函数
    return () => {
      realtimeManager.cleanup();
      unsubscribeScene();
      unsubscribeCharacter();
    };
  }

  /**
   * 解释状态变化
   */
  private interpretStateChange(state: any): string {
    const { energy, boredom, anxiety } = state;
    
    if (energy < 30) return '看起来很疲惫';
    if (boredom > 80) return '显得极其无聊';
    if (anxiety > 80) return '表现得很紧张';
    
    return '状态有所变化';
  }

  /**
   * 默认游戏状态（备用）
   */
  private getDefaultGameState(): InitialGameState {
    return {
      sceneDescription: '月影酒馆在夜幕中静静营业，等待着新的故事开始...',
      activeCharacters: [
        { id: 'linxi', name: '林溪', role: '调查员', status: '警觉地观察着', isCore: true },
        { id: 'chenhao', name: '陈浩', role: '年轻人', status: '安静地坐着', isCore: true }
      ],
      recentEvents: [],
      ambientActivity: ['远处传来低沉的交谈声', '壁炉中木材燃烧的轻微爆裂声']
    };
  }
}

// 导出单例实例
export const passiveObserver = PassiveObserverManager.getInstance();