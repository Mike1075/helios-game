/**
 * 世界引擎 - 让世界"活"起来
 * 
 * 这个系统让AI角色拥有自主生活，即使玩家不在线，世界也在运行
 * 融合你之前的世界引擎设计和Mike的信念驱动理念
 */

import { 
  WorldState, 
  Character, 
  InternalState, 
  GameEvent, 
  ActionPackage, 
  Scene,
  BeliefSystem 
} from '../types/core';
import { beliefObserver } from './BeliefObserver';
import { createCharacterStatePackage, characterBehaviorPatterns } from '../config/characters';

// ===========================================
// 世界引擎主类
// ===========================================

export class WorldEngine {
  private static instance: WorldEngine | null = null;
  private worldState: WorldState;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eventSubscribers: Set<(event: GameEvent) => void> = new Set();
  private isRunning: boolean = false;

  private constructor() {
    // 初始化月影酒馆场景
    const tavern: Scene = {
      id: 'moonlight_tavern',
      name: '月影酒馆',
      description: '昏暗的灯光下，木质桌椅散发着岁月的痕迹。空气中弥漫着酒精和烟草的味道。',
      atmosphere: '神秘而宁静',
      present_characters: [],
      tension_level: 30,
      activity_level: 45,
      time_of_day: 'evening',
      weather: '微风',
      background_events: ['远处传来低沉的交谈声', '酒杯轻微碰撞的声音'],
      created_at: Date.now(),
      last_activity: Date.now()
    };

    this.worldState = {
      scene: tavern,
      characters: new Map(),
      internal_states: new Map(),
      belief_systems: new Map(),
      recent_events: [],
      private_logs: [],
      world_time: Date.now(),
      last_heartbeat: Date.now(),
      is_active: true
    };

    console.log('🌍 世界引擎启动 - 月影酒馆开始运营...');
  }

  /**
   * 获取世界引擎单例
   */
  static getInstance(): WorldEngine {
    if (!WorldEngine.instance) {
      WorldEngine.instance = new WorldEngine();
    }
    return WorldEngine.instance;
  }

  /**
   * 初始化世界（添加AI角色）
   */
  initializeWorld(): void {
    console.log('🎭 初始化角色...');
    
    // 添加林溪和陈浩
    const linxiPack = createCharacterStatePackage('linxi');
    const chenhaoPack = createCharacterStatePackage('chenhao');
    
    this.addCharacter(linxiPack.character, linxiPack.internal_state);
    this.addCharacter(chenhaoPack.character, chenhaoPack.internal_state);
    
    // 发布初始环境事件
    this.publishEvent({
      id: `init_${Date.now()}`,
      type: 'environment',
      character_id: 'system',
      content: '月影酒馆在夜幕中静静营业，几位常客已经坐在各自习惯的位置...',
      timestamp: Date.now(),
      scene_id: this.worldState.scene.id,
      is_autonomous: true
    });
  }

  /**
   * 添加角色到世界
   */
  addCharacter(character: Character, initialState?: InternalState): void {
    this.worldState.characters.set(character.id, character);
    this.worldState.scene.present_characters.push(character.id);
    
    if (initialState) {
      this.worldState.internal_states.set(character.id, initialState);
    }
    
    console.log(`👤 ${character.name} 进入了 ${this.worldState.scene.name}`);
    
    // 发布角色进入事件
    this.publishEvent({
      id: `join_${character.id}_${Date.now()}`,
      type: 'system',
      character_id: 'system',
      content: `${character.name} 进入了酒馆`,
      timestamp: Date.now(),
      scene_id: this.worldState.scene.id,
      is_autonomous: true
    });
  }

  /**
   * 添加玩家到世界
   */
  addPlayer(playerName: string): Character {
    const player: Character = {
      id: 'player',
      name: playerName,
      role: '神秘的访客',
      core_motivation: '探索这个世界，了解其他人',
      type: 'human_player',
      is_online: true,
      current_scene: this.worldState.scene.id,
      created_at: Date.now(),
      avatar: '🧑‍💼'
    };
    
    this.addCharacter(player);
    
    // 为玩家创建空的信念系统（将被动态生成）
    const emptyBeliefSystem: BeliefSystem = {
      character_id: 'player',
      worldview: [],
      selfview: [],
      values: [],
      last_updated: Date.now(),
      based_on_logs_count: 0,
      confidence_score: 0
    };
    
    this.worldState.belief_systems.set('player', emptyBeliefSystem);
    
    return player;
  }

  /**
   * 启动世界心跳
   */
  startHeartbeat(intervalMs: number = 45000): void {
    if (this.isRunning) {
      console.log('⚠️ 世界心跳已在运行');
      return;
    }

    this.isRunning = true;
    console.log(`💓 启动世界心跳，间隔: ${intervalMs}ms (${Math.round(intervalMs/1000)}秒)`);
    
    this.heartbeatTimer = setInterval(() => {
      this.worldTick();
    }, intervalMs);
  }

  /**
   * 停止世界心跳
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.isRunning = false;
      console.log('💓 世界心跳已停止');
    }
  }

  /**
   * 世界心跳 - 核心逻辑
   */
  private async worldTick(): Promise<void> {
    const now = Date.now();
    this.worldState.last_heartbeat = now;
    
    console.log(`\n💓 世界心跳 - ${new Date(now).toLocaleTimeString()}`);
    
    try {
      // 1. 更新所有AI的内在状态
      this.updateInternalStates(now);
      
      // 2. 检查并触发AI自主行为
      await this.processAIAutonomousBehavior(now);
      
      // 3. 更新场景氛围和环境
      this.updateSceneAtmosphere(now);
      
      // 4. 清理过期数据
      this.cleanupOldData(now);
      
      // 5. 检查玩家信念更新
      await this.checkPlayerBeliefUpdates();
      
    } catch (error) {
      console.error('💥 世界心跳错误:', error);
    }
  }

  /**
   * 更新AI内在状态
   */
  private updateInternalStates(now: number): void {
    this.worldState.internal_states.forEach((state, characterId) => {
      const character = this.worldState.characters.get(characterId);
      if (!character || character.type === 'human_player') return;
      
      const timeSinceUpdate = now - state.last_updated;
      const minutesPassed = timeSinceUpdate / (1000 * 60);
      
      // 自然状态变化
      const newState = { ...state };
      
      // 无聊值增长（核心驱动力）
      newState.boredom = Math.min(100, state.boredom + minutesPassed * 2);
      
      // 能量恢复
      if (state.energy < 70) {
        newState.energy = Math.min(100, state.energy + minutesPassed * 0.5);
      }
      
      // 专注度衰减
      if (state.focus > 30) {
        newState.focus = Math.max(20, state.focus - minutesPassed * 1);
      }
      
      // 好奇心波动
      if (minutesPassed > 3) {
        newState.curiosity = Math.min(100, state.curiosity + minutesPassed * 0.3);
      }
      
      // 焦虑值衰减（陈浩特有）
      if (characterId === 'chenhao') {
        newState.anxiety = Math.max(40, state.anxiety - minutesPassed * 0.8);
      }
      
      newState.last_updated = now;
      this.worldState.internal_states.set(characterId, newState);
      
      console.log(`🧠 ${character.name} 状态更新: 无聊=${newState.boredom.toFixed(1)}, 能量=${newState.energy.toFixed(1)}`);
    });
  }

  /**
   * 处理AI自主行为 - 使用Supabase Edge Function
   */
  private async processAIAutonomousBehavior(now: number): Promise<void> {
    try {
      // 调用ai-autonomous-behavior边缘函数
      const { triggerAutonomousBehavior } = await import('../lib/supabase');
      const result = await triggerAutonomousBehavior();
      
      if (result && result.success && result.actions_generated > 0) {
        console.log(`🤖 边缘函数触发了 ${result.actions_generated} 个自主行为`);
        
        // 边缘函数已经处理了数据库更新和事件发布
        // 这里我们只需要记录到本地状态
        result.actions.forEach((action: any) => {
          console.log(`✨ ${action.character_id} 执行自主行为: ${action.action.content}`);
        });
      }
    } catch (error) {
      console.error('❌ 边缘函数调用失败，使用本地备用逻辑:', error);
      
      // 备用：使用本地逻辑
      const aiCharacters = Array.from(this.worldState.characters.values())
        .filter(char => char.type === 'ai_npc');
      
      for (const character of aiCharacters) {
        const state = this.worldState.internal_states.get(character.id);
        if (!state) continue;
        
        if (this.shouldAIAct(character, state, now)) {
          console.log(`🤖 ${character.name} 开始本地自主决策...`);
          
          try {
            const actionPackage = await this.generateAIAction(character, state);
            if (actionPackage) {
              await this.executeAIAction(character, actionPackage, now);
            }
          } catch (error) {
            console.error(`❌ ${character.name} 自主行为错误:`, error);
          }
        }
      }
    }
  }

  /**
   * 判断AI是否应该行动
   */
  private shouldAIAct(character: Character, state: InternalState, now: number): boolean {
    // 冷却时间检查：防止频繁自主行动 (最少3分钟间隔)
    const COOLDOWN_MINUTES = 3;
    const timeSinceLastAction = now - state.last_autonomous_action;
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    
    if (timeSinceLastAction < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastAction) / (60 * 1000));
      console.log(`⏰ ${character.name} 还需等待 ${remainingMinutes} 分钟才能再次自主行动`);
      return false;
    }
    
    // 无聊值驱动（主要驱动力）
    if (state.boredom > 75) {
      console.log(`😴 ${character.name} 极度无聊，必须行动`);
      return true;
    }
    
    if (state.boredom > 60 && Math.random() < 0.6) {
      console.log(`😴 ${character.name} 很无聊，60%概率行动`);
      return true;
    }
    
    // 高能量+高好奇心
    if (state.energy > 70 && state.curiosity > 60 && Math.random() < 0.4) {
      console.log(`🔍 ${character.name} 精力充沛且好奇，40%概率探索`);
      return true;
    }
    
    // 角色特有触发条件
    if (character.id === 'linxi' && state.suspicion > 60 && Math.random() < 0.3) {
      console.log(`🕵️ 林溪怀疑度较高，30%概率主动调查`);
      return true;
    }
    
    if (character.id === 'chenhao' && state.anxiety > 70 && Math.random() < 0.2) {
      console.log(`😰 陈浩焦虑度较高，20%概率自我安慰行为`);
      return true;
    }
    
    // 低概率随机行为
    if (Math.random() < 0.05) {
      console.log(`🎲 ${character.name} 随机行动`);
      return true;
    }
    
    return false;
  }

  /**
   * 生成AI行动
   */
  private async generateAIAction(character: Character, state: InternalState): Promise<ActionPackage | null> {
    try {
      // 构建AI决策上下文
      const context = this.buildAIContext(character, state);
      
      // 调用Mike的AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: context.prompt,
          playerName: character.name,
          chatHistory: context.history,
          inputType: 'autonomous_action',
          targetCharacter: character.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI API调用失败: ${response.status}`);
      }
      
      const aiResult = await response.json();
      
      // 解析AI响应为ActionPackage
      return this.parseAIResponseToActionPackage(aiResult, state);
      
    } catch (error) {
      console.warn(`⚠️ AI决策失败，使用预设行为: ${error}`);
      return this.generateFallbackAction(character, state);
    }
  }

  /**
   * 构建AI决策上下文
   */
  private buildAIContext(character: Character, state: InternalState) {
    const recentEvents = this.worldState.recent_events.slice(-5);
    const history = recentEvents.map(e => `${e.character_id}: ${e.content}`).join('\n');
    
    const prompt = `你是${character.name}，${character.role}。
    
核心动机: ${character.core_motivation}

当前内在状态:
- 能量: ${state.energy.toFixed(1)}/100
- 专注: ${state.focus.toFixed(1)}/100  
- 好奇心: ${state.curiosity.toFixed(1)}/100
- 无聊值: ${state.boredom.toFixed(1)}/100
${character.id === 'chenhao' ? `- 焦虑: ${state.anxiety.toFixed(1)}/100` : ''}
${character.id === 'linxi' ? `- 怀疑: ${state.suspicion.toFixed(1)}/100` : ''}

当前场景: ${this.worldState.scene.name} - ${this.worldState.scene.atmosphere}
在场人员: ${this.worldState.scene.present_characters.map(id => 
  this.worldState.characters.get(id)?.name || id
).join(', ')}

最近发生的事:
${history || '暂时很安静...'}

请基于你的性格和当前状态，决定此刻要做什么。可以是:
1. 说话 (dialogue)
2. 行动 (action)  
3. 继续观察 (wait)

回应格式: 简短自然的行为，符合你的角色设定。`;

    return { prompt, history };
  }

  /**
   * 解析AI响应为ActionPackage
   */
  private parseAIResponseToActionPackage(aiResult: any, state: InternalState): ActionPackage | null {
    if (!aiResult.success || !aiResult.action_package) {
      return null;
    }
    
    const actionPackage = aiResult.action_package;
    
    // 添加情绪变化
    actionPackage.emotion_change = {
      boredom: Math.max(0, state.boredom - 25), // 行动后无聊值降低
      energy: Math.max(0, state.energy - 5),   // 行动消耗能量
      last_activity: Date.now()
    };
    
    return actionPackage;
  }

  /**
   * 生成预设行为（备用）
   */
  private generateFallbackAction(character: Character, state: InternalState): ActionPackage {
    const patterns = characterBehaviorPatterns[character.id as keyof typeof characterBehaviorPatterns];
    
    if (!patterns) {
      return {
        action: `${character.name}静静地坐在那里，观察着周围`,
        action_type: 'action',
        confidence: 0.3
      };
    }
    
    // 根据状态选择行为
    if (state.boredom > 70) {
      const behavior = patterns.proactive_behaviors[Math.floor(Math.random() * patterns.proactive_behaviors.length)];
      return {
        action: behavior,
        action_type: 'action',
        confidence: 0.6,
        emotion_change: {
          boredom: Math.max(0, state.boredom - 30),
          energy: Math.max(0, state.energy - 8)
        }
      };
    }
    
    return {
      action: `${character.name}若有所思地看着远处`,
      action_type: 'action', 
      confidence: 0.4
    };
  }

  /**
   * 执行AI行动
   */
  private async executeAIAction(character: Character, actionPackage: ActionPackage, now: number): Promise<void> {
    // 更新内在状态
    if (actionPackage.emotion_change) {
      const currentState = this.worldState.internal_states.get(character.id);
      if (currentState) {
        const newState = { ...currentState, ...actionPackage.emotion_change };
        this.worldState.internal_states.set(character.id, newState);
      }
    }
    
    // 发布公开事件
    if (actionPackage.dialogue) {
      this.publishEvent({
        id: `ai_dialogue_${character.id}_${now}`,
        type: 'dialogue',
        character_id: character.id,
        content: actionPackage.dialogue,
        timestamp: now,
        scene_id: this.worldState.scene.id,
        is_autonomous: true,
        emotion_context: `能量=${this.worldState.internal_states.get(character.id)?.energy.toFixed(1)}`
      });
    }
    
    if (actionPackage.action) {
      this.publishEvent({
        id: `ai_action_${character.id}_${now}`,
        type: 'action', 
        character_id: character.id,
        content: actionPackage.action,
        timestamp: now,
        scene_id: this.worldState.scene.id,
        is_autonomous: true
      });
    }
    
    // 记录私有思考（仅日志）
    if (actionPackage.internal_thought) {
      this.worldState.private_logs.push({
        id: `ai_thought_${character.id}_${now}`,
        type: 'thought',
        character_id: character.id,
        content: actionPackage.internal_thought,
        timestamp: now,
        scene_id: this.worldState.scene.id
      });
    }
    
    // 更新最后自主行动时间（防止频繁行动）
    const currentState = this.worldState.internal_states.get(character.id);
    if (currentState) {
      const updatedState = { ...currentState, last_autonomous_action: now };
      this.worldState.internal_states.set(character.id, updatedState);
    }
    
    console.log(`✨ ${character.name} 执行自主行为完成`);
  }

  /**
   * 更新场景氛围
   */
  private updateSceneAtmosphere(now: number): void {
    const recentActivity = this.worldState.recent_events.filter(
      e => now - e.timestamp < 300000 // 5分钟内
    ).length;
    
    // 更新活跃度
    this.worldState.scene.activity_level = Math.min(100, recentActivity * 10);
    
    // 根据活跃度调整氛围
    if (this.worldState.scene.activity_level > 70) {
      this.worldState.scene.atmosphere = '热烈而活跃';
    } else if (this.worldState.scene.activity_level > 40) {
      this.worldState.scene.atmosphere = '温和而友好';
    } else {
      this.worldState.scene.atmosphere = '宁静而神秘';
    }
  }

  /**
   * 清理过期数据
   */
  private cleanupOldData(now: number): void {
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // 清理事件历史
    this.worldState.recent_events = this.worldState.recent_events.filter(
      e => e.timestamp > oneHourAgo
    );
    
    this.worldState.private_logs = this.worldState.private_logs.filter(
      e => e.timestamp > oneHourAgo
    );
  }

  /**
   * 检查玩家信念更新 - 使用Supabase Edge Function
   */
  private async checkPlayerBeliefUpdates(): Promise<void> {
    if (beliefObserver.shouldUpdateBeliefSystem('player')) {
      console.log('🔮 检测到玩家行为变化，准备更新信念系统...');
      
      try {
        // 调用belief-analyzer边缘函数
        const { analyzeBeliefs } = await import('../lib/supabase');
        const result = await analyzeBeliefs('player', 5);
        
        if (result && result.success) {
          console.log('✨ 玩家信念系统已通过边缘函数更新');
          
          if (result.cognitive_dissonance_detected) {
            console.log('🧠 检测到认知失调，回响之室邀请已发送');
          }
        }
      } catch (error) {
        console.error('❌ 边缘函数调用失败，使用本地备用逻辑:', error);
        
        // 备用：使用本地逻辑
        beliefObserver.generateBeliefSystem('player').then(newBelief => {
          if (newBelief) {
            this.worldState.belief_systems.set('player', newBelief);
            console.log('✨ 玩家信念系统已通过本地逻辑更新');
          }
        }).catch(error => {
          console.warn('⚠️ 玩家信念更新失败:', error);
        });
      }
    }
  }

  /**
   * 发布事件
   */
  publishEvent(event: GameEvent): void {
    this.worldState.recent_events.push(event);
    this.worldState.private_logs.push(event);
    
    // 记录行为到信念观察者
    if (event.character_id && event.character_id !== 'system') {
      beliefObserver.recordBehavior(event.character_id, event);
    }
    
    // 通知订阅者
    this.eventSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('事件订阅者错误:', error);
      }
    });
    
    console.log(`📢 事件发布: [${event.type}] ${event.character_id}: ${event.content}`);
  }

  /**
   * 订阅事件流
   */
  subscribe(callback: (event: GameEvent) => void): () => void {
    this.eventSubscribers.add(callback);
    
    return () => {
      this.eventSubscribers.delete(callback);
    };
  }

  /**
   * 获取世界状态（只读）
   */
  getWorldState(): Readonly<WorldState> {
    return this.worldState;
  }

  /**
   * 获取最近事件
   */
  getRecentEvents(limit: number = 20): GameEvent[] {
    return this.worldState.recent_events.slice(-limit);
  }

  /**
   * 销毁世界引擎
   */
  destroy(): void {
    this.stopHeartbeat();
    this.eventSubscribers.clear();
    WorldEngine.instance = null;
    console.log('🌍 世界引擎已销毁');
  }
}

// 导出单例工厂函数（延迟加载）
export const getWorldEngine = () => WorldEngine.getInstance();

// 导出单例（为了兼容性）
export const worldEngine = getWorldEngine();