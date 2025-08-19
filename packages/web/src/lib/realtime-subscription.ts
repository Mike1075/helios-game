/**
 * 实时订阅管理器 - 订阅"世界切片"
 * 
 * 实现老师提到的订阅机制：前端订阅关心的"世界切片"
 * 而不是传统的请求-响应模式
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// 订阅事件类型
interface SceneEvent {
  id: string;
  scene_id: string;
  character_id: string;
  event_type: 'dialogue' | 'action' | 'environment' | 'system';
  content: string;
  timestamp: number;
  is_autonomous?: boolean;
  emotion_context?: string;
}

interface PlayerEvent {
  id: string;
  player_id: string;
  event_type: 'cognitive_dissonance' | 'belief_update' | 'chamber_invitation';
  content: string;
  trigger_data: any;
  timestamp: number;
  processed: boolean;
}

interface CharacterState {
  id: string;
  character_id: string;
  energy: number;
  focus: number;
  curiosity: number;
  boredom: number;
  anxiety?: number;
  suspicion?: number;
  last_updated: number;
}

// 事件回调类型
type SceneEventCallback = (event: SceneEvent) => void;
type PlayerEventCallback = (event: PlayerEvent) => void;
type CharacterStateCallback = (state: CharacterState) => void;

/**
 * 实时订阅管理器
 * 管理所有的Supabase Realtime订阅
 */
export class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private sceneEventCallbacks: Set<SceneEventCallback> = new Set();
  private playerEventCallbacks: Set<PlayerEventCallback> = new Set();
  private characterStateCallbacks: Set<CharacterStateCallback> = new Set();
  private isRealtimeEnabled = true; // 实时功能启用状态
  private connectionErrors = 0; // 连接错误计数

  /**
   * 订阅场景事件频道
   * 接收AI自主行动、环境变化、其他玩家行动
   */
  subscribeToScene(sceneId: string): void {
    console.log('📡 重新启用实时订阅 - 场景事件');
    
    if (!this.isRealtimeEnabled) {
      console.warn('⚠️ 实时功能已禁用，跳过场景订阅');
      return;
    }

    const channelName = `scene_events:${sceneId}`;
    
    if (this.channels.has(channelName)) {
      console.log(`🔄 场景频道已存在: ${channelName}`);
      return;
    }

    console.log(`📡 订阅场景事件: ${sceneId}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scene_events',
          filter: `scene_id=eq.${sceneId}`
        },
        (payload) => {
          console.log('🎭 场景事件:', payload.new);
          const event = payload.new as SceneEvent;
          this.notifySceneEventCallbacks(event);
        }
      )
      .subscribe((status) => {
        console.log(`📡 场景订阅状态 [${sceneId}]:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ 场景订阅失败 [${sceneId}]: WebSocket连接错误`);
          this.handleConnectionError(channelName);
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * 订阅玩家状态频道
   * 接收认知失调触发、信念更新、回响之室邀请等
   */
  subscribeToPlayer(playerId: string): void {
    console.log('📡 重新启用实时订阅 - 玩家事件');
    
    const channelName = `player_status:${playerId}`;
    
    if (this.channels.has(channelName)) {
      console.log(`🔄 玩家频道已存在: ${channelName}`);
      return;
    }

    console.log(`👤 订阅玩家事件: ${playerId}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_events',
          filter: `player_id=eq.${playerId}`
        },
        (payload) => {
          console.log('🧠 玩家事件:', payload.new);
          const event = payload.new as PlayerEvent;
          this.notifyPlayerEventCallbacks(event);
        }
      )
      .subscribe((status) => {
        console.log(`👤 玩家订阅状态 [${playerId}]:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ 玩家订阅失败 [${playerId}]: WebSocket连接错误`);
          this.handleConnectionError(channelName);
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * 订阅角色状态频道
   * 接收AI角色的内在状态变化（能量、情绪等）
   */
  subscribeToCharacterStates(): void {
    console.log('📡 重新启用实时订阅 - 角色状态');
    
    const channelName = 'character_states:all';
    
    if (this.channels.has(channelName)) {
      console.log(`🔄 角色状态频道已存在`);
      return;
    }

    console.log(`🤖 订阅角色状态变化`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'character_states'
        },
        (payload) => {
          console.log('🎯 角色状态更新:', payload.new);
          const state = payload.new as CharacterState;
          this.notifyCharacterStateCallbacks(state);
        }
      )
      .subscribe((status) => {
        console.log(`🤖 角色状态订阅状态:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ 角色状态订阅失败: WebSocket连接错误`);
          this.handleConnectionError(channelName);
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(channelName: string): void {
    this.connectionErrors++;
    this.channels.delete(channelName);
    
    // 如果错误过多，禁用实时功能
    if (this.connectionErrors >= 3) {
      console.warn('⚠️ 连接错误过多，禁用实时功能。游戏将在基础模式下运行。');
      this.isRealtimeEnabled = false;
      this.cleanup(); // 清理所有现有连接
    }
  }

  /**
   * 检查实时功能是否可用
   */
  isRealtimeAvailable(): boolean {
    return this.isRealtimeEnabled;
  }

  /**
   * 进入场景时的完整订阅设置
   */
  enterScene(sceneId: string, playerId: string): void {
    console.log(`🌍 进入场景: ${sceneId}, 玩家: ${playerId}`);
    
    // 订阅场景的所有实时更新
    this.subscribeToScene(sceneId);
    
    // 订阅玩家的个人事件
    this.subscribeToPlayer(playerId);
    
    // 订阅所有角色状态变化
    this.subscribeToCharacterStates();
  }

  /**
   * 离开场景时清理订阅
   */
  leaveScene(sceneId: string, playerId: string): void {
    console.log(`🚪 离开场景: ${sceneId}, 玩家: ${playerId}`);
    
    const sceneChannelName = `scene_events:${sceneId}`;
    const playerChannelName = `player_status:${playerId}`;
    const characterChannelName = 'character_states:all';

    [sceneChannelName, playerChannelName, characterChannelName].forEach(name => {
      const channel = this.channels.get(name);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(name);
        console.log(`❌ 取消订阅: ${name}`);
      }
    });
  }

  /**
   * 注册场景事件回调
   */
  onSceneEvent(callback: SceneEventCallback): () => void {
    this.sceneEventCallbacks.add(callback);
    return () => this.sceneEventCallbacks.delete(callback);
  }

  /**
   * 注册玩家事件回调
   */
  onPlayerEvent(callback: PlayerEventCallback): () => void {
    this.playerEventCallbacks.add(callback);
    return () => this.playerEventCallbacks.delete(callback);
  }

  /**
   * 注册角色状态回调
   */
  onCharacterState(callback: CharacterStateCallback): () => void {
    this.characterStateCallbacks.add(callback);
    return () => this.characterStateCallbacks.delete(callback);
  }

  /**
   * 通知场景事件回调
   */
  private notifySceneEventCallbacks(event: SceneEvent): void {
    this.sceneEventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('场景事件回调错误:', error);
      }
    });
  }

  /**
   * 通知玩家事件回调
   */
  private notifyPlayerEventCallbacks(event: PlayerEvent): void {
    this.playerEventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('玩家事件回调错误:', error);
      }
    });
  }

  /**
   * 通知角色状态回调
   */
  private notifyCharacterStateCallbacks(state: CharacterState): void {
    this.characterStateCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('角色状态回调错误:', error);
      }
    });
  }

  /**
   * 清理所有订阅
   */
  cleanup(): void {
    console.log('🧹 清理所有实时订阅');
    
    this.channels.forEach((channel, name) => {
      channel.unsubscribe();
      console.log(`❌ 取消订阅: ${name}`);
    });
    
    this.channels.clear();
    this.sceneEventCallbacks.clear();
    this.playerEventCallbacks.clear();
    this.characterStateCallbacks.clear();
  }

  /**
   * 获取当前订阅状态
   */
  getSubscriptionStatus(): {
    activeChannels: string[];
    totalCallbacks: number;
  } {
    return {
      activeChannels: Array.from(this.channels.keys()),
      totalCallbacks: this.sceneEventCallbacks.size + 
                     this.playerEventCallbacks.size + 
                     this.characterStateCallbacks.size
    };
  }
}

// 全局实时订阅管理器实例
export const realtimeManager = new RealtimeSubscriptionManager();

// 便捷的Hook式API
export function useSceneSubscription(sceneId: string, playerId: string, callbacks: {
  onSceneEvent?: SceneEventCallback;
  onPlayerEvent?: PlayerEventCallback;  
  onCharacterState?: CharacterStateCallback;
}) {
  const { onSceneEvent, onPlayerEvent, onCharacterState } = callbacks;

  // 注册回调
  const unsubscribeFunctions: (() => void)[] = [];
  
  if (onSceneEvent) {
    unsubscribeFunctions.push(realtimeManager.onSceneEvent(onSceneEvent));
  }
  
  if (onPlayerEvent) {
    unsubscribeFunctions.push(realtimeManager.onPlayerEvent(onPlayerEvent));
  }
  
  if (onCharacterState) {
    unsubscribeFunctions.push(realtimeManager.onCharacterState(onCharacterState));
  }

  // 进入场景
  realtimeManager.enterScene(sceneId, playerId);

  // 返回清理函数
  return () => {
    unsubscribeFunctions.forEach(unsub => unsub());
    realtimeManager.leaveScene(sceneId, playerId);
  };
}