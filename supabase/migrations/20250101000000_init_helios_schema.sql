-- Helios Game Database Schema Migration
-- This file initializes all required tables for the Helios game

-- 1. 游戏事件表 (重命名为scene_events以匹配代码)
CREATE TABLE IF NOT EXISTS scene_events (
    id TEXT PRIMARY KEY DEFAULT ('event_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    scene_id TEXT NOT NULL DEFAULT 'moonlight_tavern',
    character_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('dialogue', 'action', 'environment', 'system', 'autonomous_action')),
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    player_name TEXT,
    is_autonomous BOOLEAN DEFAULT false,
    emotion_context TEXT,
    internal_state JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 角色状态表 (修复数据类型问题)
CREATE TABLE IF NOT EXISTS character_states (
    id TEXT PRIMARY KEY DEFAULT ('state_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    character_id TEXT NOT NULL,
    energy DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    focus DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    curiosity DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    boredom DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    anxiety DECIMAL(5,2) DEFAULT 50.0,
    suspicion DECIMAL(5,2) DEFAULT 50.0,
    last_updated BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    last_autonomous_action BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(character_id)
);

-- 3. 角色记忆表 (新增缺失的表)
CREATE TABLE IF NOT EXISTS character_memories (
    id TEXT PRIMARY KEY DEFAULT ('memory_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    character_id TEXT NOT NULL,
    event_id TEXT,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('interaction', 'observation', 'internal', 'belief_update')),
    content TEXT NOT NULL,
    emotional_weight DECIMAL(3,2) DEFAULT 0.5,
    timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (event_id) REFERENCES scene_events(id) ON DELETE SET NULL
);

-- 4. 信念系统表
CREATE TABLE IF NOT EXISTS belief_systems (
    id TEXT PRIMARY KEY DEFAULT ('belief_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    character_id TEXT NOT NULL,
    worldview JSONB NOT NULL DEFAULT '[]',
    selfview JSONB NOT NULL DEFAULT '[]',
    values JSONB NOT NULL DEFAULT '[]',
    last_updated BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    based_on_logs_count INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(character_id)
);

-- 5. 玩家事件表 (用于认知失调等)
CREATE TABLE IF NOT EXISTS player_events (
    id TEXT PRIMARY KEY DEFAULT ('player_event_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    player_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('cognitive_dissonance', 'belief_update', 'chamber_invitation')),
    content TEXT NOT NULL,
    trigger_data JSONB,
    timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 代理日志表 (用于belief分析)
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT ('log_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    character_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 动态角色表
CREATE TABLE IF NOT EXISTS dynamic_characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    personality JSONB,
    created_by_analysis BOOLEAN DEFAULT true,
    scene_id TEXT DEFAULT 'moonlight_tavern',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_scene_events_scene_id ON scene_events(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_events_character_id ON scene_events(character_id);
CREATE INDEX IF NOT EXISTS idx_scene_events_timestamp ON scene_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_character_memories_character_id ON character_memories(character_id);
CREATE INDEX IF NOT EXISTS idx_player_events_player_id ON player_events(player_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_character_id ON agent_logs(character_id);

-- 初始化核心角色状态
INSERT INTO character_states (character_id, energy, focus, curiosity, boredom, anxiety, suspicion, last_autonomous_action) 
VALUES 
    ('linxi', 75.0, 80.0, 70.0, 20.0, 30.0, 60.0, 0),
    ('chenhao', 60.0, 50.0, 80.0, 40.0, 70.0, 25.0, 0)
ON CONFLICT (character_id) DO UPDATE SET
    energy = EXCLUDED.energy,
    focus = EXCLUDED.focus,
    curiosity = EXCLUDED.curiosity,
    boredom = EXCLUDED.boredom,
    anxiety = EXCLUDED.anxiety,
    suspicion = EXCLUDED.suspicion,
    last_autonomous_action = 0;

-- 初始化核心角色信念系统
INSERT INTO belief_systems (character_id, worldview, selfview, values) 
VALUES 
    ('linxi', 
     '[{"belief": "世界充满隐藏的真相", "strength": 0.9}, {"belief": "调查是揭示真相的唯一方式", "strength": 0.8}]',
     '[{"belief": "我是一个专业的调查员", "strength": 0.9}, {"belief": "我有责任保护无辜的人", "strength": 0.7}]',
     '[{"belief": "真相比和谐更重要", "strength": 0.8}, {"belief": "正义必须得到伸张", "strength": 0.9}]'),
    ('chenhao', 
     '[{"belief": "世界基本上是安全的", "strength": 0.6}, {"belief": "大多数人都是善良的", "strength": 0.7}]',
     '[{"belief": "我还年轻，有很多要学习", "strength": 0.8}, {"belief": "我容易相信别人", "strength": 0.6}]',
     '[{"belief": "友谊比真相更重要", "strength": 0.7}, {"belief": "应该避免冲突", "strength": 0.8}]')
ON CONFLICT (character_id) DO NOTHING;