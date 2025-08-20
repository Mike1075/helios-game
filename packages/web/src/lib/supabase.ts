/**
 * Supabase数据库集成
 * 处理游戏数据的持久化存储
 */

import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端 - 使用标准的Next.js环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 数据库表类型定义
export interface GameEvent {
  id: string;
  character_id: string;
  event_type: 'dialogue' | 'action' | 'autonomous_action';
  content: string;
  timestamp: number;
  scene_id: string;
  player_name?: string;
  internal_state?: any;
  metadata?: any;
}

export interface BeliefRecord {
  id: string;
  character_id: string;
  worldview: any[];
  selfview: any[];
  values: any[];
  last_updated: number;
  based_on_logs_count: number;
  confidence_score: number;
}

export interface CharacterState {
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

/**
 * 保存游戏事件到数据库
 */
export async function saveGameEvent(event: Omit<GameEvent, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('scene_events')
      .insert([{
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }])
      .select()
      .single();

    if (error) {
      console.error('保存游戏事件失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('数据库错误:', error);
    return null;
  }
}

/**
 * 获取角色的最近事件历史
 */
export async function getCharacterHistory(characterId: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('scene_events')
      .select('*')
      .or(`character_id.eq.${characterId},character_id.eq.player`)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取角色历史失败:', error);
      return [];
    }

    return data.reverse(); // 按时间正序返回
  } catch (error) {
    console.error('数据库错误:', error);
    return [];
  }
}

/**
 * 保存角色信念系统
 */
export async function saveBeliefSystem(belief: Omit<BeliefRecord, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('belief_systems')
      .upsert([{
        ...belief,
        id: `belief_${belief.character_id}_${Date.now()}`
      }])
      .select()
      .single();

    if (error) {
      console.error('保存信念系统失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('数据库错误:', error);
    return null;
  }
}

/**
 * 获取角色信念系统
 */
export async function getBeliefSystem(characterId: string) {
  try {
    const { data, error } = await supabase
      .from('belief_systems')
      .select('*')
      .eq('character_id', characterId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('获取信念系统失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('数据库错误:', error);
    return null;
  }
}

/**
 * 更新角色内部状态
 */
export async function updateCharacterState(state: Omit<CharacterState, 'id'>) {
  try {
    // 使用onConflict确保更新而不是创建新记录
    const { data, error } = await supabase
      .from('character_states')
      .upsert([{
        ...state,
        last_updated: Date.now()
      }], { 
        onConflict: 'character_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('更新角色状态失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('数据库错误:', error);
    return null;
  }
}

/**
 * 获取角色当前状态
 */
export async function getCharacterState(characterId: string) {
  try {
    const { data, error } = await supabase
      .from('character_states')
      .select('*')
      .eq('character_id', characterId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('获取角色状态失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('数据库错误:', error);
    return null;
  }
}

/**
 * 调用belief-analyzer边缘函数
 * 分析玩家的信念系统并检测认知失调
 */
export async function analyzeBeliefs(playerId: string, recentLogsCount: number = 5) {
  try {
    const { data, error } = await supabase.functions.invoke('belief-analyzer', {
      body: {
        player_id: playerId,
        recent_logs_count: recentLogsCount
      }
    });

    if (error) {
      console.error('信念分析失败:', error);
      return null;
    }

    console.log('✨ 信念分析结果:', data);
    return data;
  } catch (error) {
    console.error('边缘函数调用错误:', error);
    return null;
  }
}

/**
 * 调用ai-autonomous-behavior边缘函数
 * 检查所有AI角色的状态并生成必要的自主行为
 */
export async function triggerAutonomousBehavior() {
  try {
    const { data, error } = await supabase.functions.invoke('ai-autonomous-behavior', {
      body: {}
    });

    if (error) {
      console.error('自主行为触发失败:', error);
      return null;
    }

    console.log('🤖 自主行为结果:', data);
    return data;
  } catch (error) {
    console.error('边缘函数调用错误:', error);
    return null;
  }
}

/**
 * 检查数据库表是否存在和可访问
 */
export async function checkDatabaseStatus() {
  const checks = {
    character_states: false,
    scene_events: false,
    belief_systems: false
  };

  try {
    // 检查character_states表
    const { error: statesError } = await supabase
      .from('character_states')
      .select('character_id', { count: 'exact', head: true });
    checks.character_states = !statesError;
    if (statesError) console.warn('character_states表访问失败:', statesError.message);

    // 检查scene_events表  
    const { error: eventsError } = await supabase
      .from('scene_events')
      .select('id', { count: 'exact', head: true });
    checks.scene_events = !eventsError;
    if (eventsError) console.warn('scene_events表访问失败:', eventsError.message);

    // 检查belief_systems表
    const { error: beliefsError } = await supabase
      .from('belief_systems')
      .select('character_id', { count: 'exact', head: true });
    checks.belief_systems = !beliefsError;
    if (beliefsError) console.warn('belief_systems表访问失败:', beliefsError.message);

  } catch (error) {
    console.error('数据库状态检查失败:', error);
  }

  console.log('📊 数据库状态检查结果:', checks);
  return checks;
}