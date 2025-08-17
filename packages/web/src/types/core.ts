/**
 * 《赫利俄斯 - 本我之镜》核心类型定义
 * 
 * 融合Mike的"信念涌现"理念和实时世界模拟系统
 */

// ===========================================
// 角色系统 - "本我之镜"核心
// ===========================================

/**
 * 角色类型：真人玩家 vs AI角色
 */
export type CharacterType = 'human_player' | 'ai_npc';

/**
 * 角色基础信息
 */
export interface Character {
  id: string;
  name: string;
  role: string; // 身份描述，如"调查员"、"年轻人"
  core_motivation: string; // 核心动机，驱动行为的内在力量
  type: CharacterType;
  is_online: boolean;
  current_scene: string;
  created_at: number;
  
  // 扩展属性
  avatar?: string; // 头像表情符号
  description?: string; // 简短描述
}

// ===========================================
// 信念系统 - Mike的核心创新
// ===========================================

/**
 * 单个信念项
 */
export interface BeliefItem {
  description: string; // 信念描述
  weight: number; // 信念强度 (0-1)
  evidence_count: number; // 支持证据数量
  last_updated: number; // 最后更新时间
}

/**
 * 完整信念系统 - 从行为中动态生成
 */
export interface BeliefSystem {
  character_id: string;
  
  // Mike的三层信念结构
  worldview: BeliefItem[]; // 世界观："世界是如何运作的"
  selfview: BeliefItem[]; // 自我认知："我是什么样的人"
  values: BeliefItem[]; // 价值观："什么是重要的"
  
  // 元数据
  last_updated: number;
  based_on_logs_count: number; // 基于多少行为记录生成
  confidence_score: number; // 信念系统的可靠性 (0-1)
}

// ===========================================
// AI内在状态系统 - 情绪驱动
// ===========================================

/**
 * AI的私有内在状态 - 影响所有决策
 */
export interface InternalState {
  // 基础状态 (0-100)
  energy: number; // 能量水平，影响主动性
  focus: number; // 专注度，影响思考深度
  curiosity: number; // 好奇心，影响探索欲望
  confidence: number; // 自信度，影响表达方式
  
  // 特殊状态
  boredom: number; // 无聊值，过高会主动寻找话题
  anxiety: number; // 焦虑值，影响回避倾向
  suspicion: number; // 怀疑度，影响信任程度
  
  // 时间戳
  last_updated: number;
  last_activity: number; // 最后活动时间，用于状态衰减
}

// ===========================================
// 事件和消息系统
// ===========================================

/**
 * 游戏事件类型
 */
export type EventType = 
  | 'dialogue'      // 对话
  | 'action'        // 行动
  | 'thought'       // 内心想法（仅日志）
  | 'environment'   // 环境变化
  | 'system';       // 系统事件

/**
 * 游戏消息/事件
 */
export interface GameEvent {
  id: string;
  type: EventType;
  character_id: string;
  content: string;
  timestamp: number;
  scene_id: string;
  
  // 扩展信息
  is_autonomous?: boolean; // 是否为AI自主行为
  emotion_context?: string; // 情绪上下文
  belief_trigger?: string[]; // 触发的信念
}

/**
 * 行动包 - AI的复合响应
 */
export interface ActionPackage {
  // 公开部分（玩家可见）
  dialogue?: string; // 说的话
  action?: string; // 做的动作
  
  // 私有部分（仅日志）
  internal_thought?: string; // 内心想法
  emotion_change?: Partial<InternalState>; // 情绪变化
  decision_reason?: string; // 决策原因
  
  // 元数据
  confidence: number; // 决策信心 (0-1)
  action_type: EventType;
}

// ===========================================
// 世界状态和场景
// ===========================================

/**
 * 游戏场景
 */
export interface Scene {
  id: string;
  name: string; // 如"月影酒馆"
  description: string;
  atmosphere: string; // 当前氛围
  
  // 动态属性
  present_characters: string[]; // 在场角色
  tension_level: number; // 紧张度 (0-100)
  activity_level: number; // 活跃度 (0-100)
  
  // 环境因素
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: string;
  background_events?: string[]; // 背景事件
  
  created_at: number;
  last_activity: number;
}

/**
 * 世界状态 - 单一真相源
 */
export interface WorldState {
  scene: Scene;
  characters: Map<string, Character>;
  internal_states: Map<string, InternalState>; // AI的内在状态
  belief_systems: Map<string, BeliefSystem>; // 所有角色的信念
  
  // 事件历史
  recent_events: GameEvent[]; // 最近事件（玩家可见）
  private_logs: GameEvent[]; // 完整日志（包含思考）
  
  // 时间管理
  world_time: number; // 游戏世界时间
  last_heartbeat: number; // 最后心跳时间
  is_active: boolean;
}

// ===========================================
// API接口定义
// ===========================================

/**
 * 聊天API请求
 */
export interface ChatRequest {
  user_message: string;
  player_name: string;
  chat_history?: string;
  input_type?: 'dialogue' | 'action'; // 输入类型
  target_character?: string; // 指定目标角色
}

/**
 * 聊天API响应
 */
export interface ChatResponse {
  success: boolean;
  
  // 成功时的响应
  character?: Character;
  action_package?: ActionPackage;
  routing_type?: 'CORE_AI' | 'SYSTEM_AI' | 'PARALLEL';
  
  // 并行响应（多个AI同时回应）
  responses?: Array<{
    character: Character;
    action_package: ActionPackage;
  }>;
  
  // 错误信息
  error?: string;
  debug_info?: Record<string, any>;
}

/**
 * 世界状态API响应
 */
export interface WorldStateResponse {
  success: boolean;
  world_state?: {
    scene: Scene;
    characters: Character[];
    recent_events: GameEvent[];
  };
  error?: string;
}

/**
 * 信念分析API响应
 */
export interface BeliefAnalysisResponse {
  success: boolean;
  belief_system?: BeliefSystem;
  analysis_summary?: string;
  new_insights?: string[];
  error?: string;
}

// ===========================================
// 配置和设置
// ===========================================

/**
 * 游戏配置
 */
export interface GameConfig {
  // 世界心跳设置
  heartbeat_interval: number; // 心跳间隔（毫秒）
  
  // AI行为参数
  ai_response_delay: [number, number]; // 响应延迟范围
  max_autonomous_actions_per_minute: number;
  
  // 信念系统参数
  belief_analysis_threshold: number; // 多少行为后开始分析
  belief_update_frequency: number; // 信念更新频率
  
  // 情绪系统参数
  emotion_decay_rate: number; // 情绪衰减速率
  boredom_threshold: number; // 无聊阈值
  
  // 场景参数
  max_event_history: number; // 最大事件历史
  scene_cleanup_interval: number; // 场景清理间隔
}

/**
 * 角色配置模板
 */
export interface CharacterTemplate {
  id: string;
  name: string;
  role: string;
  core_motivation: string;
  
  // 初始状态范围
  initial_state_ranges: {
    energy: [number, number];
    focus: [number, number];
    curiosity: [number, number];
    confidence: [number, number];
  };
  
  // 行为倾向
  behavior_traits: {
    proactivity: number; // 主动性 (0-1)
    sociability: number; // 社交性 (0-1)
    emotional_stability: number; // 情绪稳定性 (0-1)
    openness: number; // 开放性 (0-1)
  };
  
  // 触发关键词
  trigger_keywords?: string[];
  response_probability?: number;
}

// ===========================================
// 工具类型
// ===========================================

/**
 * 时间戳工具
 */
export type Timestamp = number;

/**
 * ID生成器类型
 */
export type IDGenerator = () => string;

/**
 * 概率值 (0-1)
 */
export type Probability = number;

/**
 * 权重值 (0-1)
 */
export type Weight = number;

/**
 * 错误类型
 */
export interface HeliosError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}