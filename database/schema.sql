-- Helios Game Database Schema
-- 基于PRD 1.2 "本我之镜"架构设计

-- =============================================
-- 核心数据表
-- =============================================

-- 1. 角色表 (所有玩家和NPC)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL, -- 例如: "旅行者", "卫兵", "商人"
    core_motivation TEXT NOT NULL, -- 核心动机描述
    is_player BOOLEAN DEFAULT false, -- 是否为人类玩家
    is_active BOOLEAN DEFAULT true, -- 是否活跃
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 可选扩展字段
    avatar_url TEXT,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb -- 标签数组，如 ["友善", "谨慎"]
);

-- 2. 信念系统表 (动态生成的信念YAML)
CREATE TABLE belief_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    belief_yaml TEXT NOT NULL, -- 完整的YAML格式信念系统
    generation_count INTEGER DEFAULT 1, -- 第几次生成/更新
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 信念置信度 0.0-1.0
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个角色只有一个最新的信念系统
    UNIQUE(character_id)
);

-- 3. 代理日志表 (所有有意义的交互记录)
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    scene_id VARCHAR(100) DEFAULT 'harbor_tavern', -- 场景标识
    action_type VARCHAR(50) NOT NULL, -- 'chat', 'action', 'decision'等
    input_data JSONB NOT NULL, -- 输入数据 (用户消息、动作参数等)
    output_data JSONB NOT NULL, -- 输出数据 (NPC回复、动作结果等)
    belief_snapshot TEXT, -- 当时的信念系统快照
    session_id VARCHAR(100), -- 会话标识
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引优化
    INDEX idx_agent_logs_character_timestamp (character_id, timestamp),
    INDEX idx_agent_logs_scene_timestamp (scene_id, timestamp),
    INDEX idx_agent_logs_action_type (action_type)
);

-- 4. 事件表 (导演引擎触发的事件)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL, -- 'catalyst.dissonance', 'world.tension'等
    payload JSONB NOT NULL, -- 事件数据
    trigger_character_id UUID REFERENCES characters(id), -- 触发事件的角色
    scene_id VARCHAR(100) DEFAULT 'harbor_tavern',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_events_type_status (type, status),
    INDEX idx_events_scene_status (scene_id, status)
);

-- =============================================
-- 扩展数据表 (支持未来功能)
-- =============================================

-- 5. 场景表 (游戏世界的不同区域)
CREATE TABLE scenes (
    id VARCHAR(100) PRIMARY KEY, -- 'harbor_tavern', 'market_square'等
    name VARCHAR(200) NOT NULL,
    description TEXT,
    atmosphere JSONB DEFAULT '{}'::jsonb, -- 氛围设定
    active_characters JSONB DEFAULT '[]'::jsonb, -- 当前在场角色ID列表
    world_state JSONB DEFAULT '{}'::jsonb, -- 场景状态数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 关系表 (角色间的动态关系)
CREATE TABLE character_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_a_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    character_b_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'trust', 'hostility', 'romantic'等
    strength DECIMAL(3,2) DEFAULT 0.0, -- 关系强度 -1.0 到 1.0
    notes TEXT, -- 关系描述
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 防止重复关系
    UNIQUE(character_a_id, character_b_id, relationship_type),
    -- 确保 A != B
    CHECK (character_a_id != character_b_id)
);

-- 7. 世界状态表 (全局游戏状态)
CREATE TABLE world_state (
    id VARCHAR(100) PRIMARY KEY, -- 'global', 'harbor_tavern'等
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) -- 'director_engine', 'player_action'等
);

-- =============================================
-- 数据库函数和触发器
-- =============================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加自动更新触发器
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON character_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 视图 (便于查询)
-- =============================================

-- 角色完整信息视图 (包含最新信念系统)
CREATE VIEW character_profiles AS
SELECT 
    c.*,
    bs.belief_yaml,
    bs.confidence_score,
    bs.last_updated as belief_last_updated
FROM characters c
LEFT JOIN belief_systems bs ON c.id = bs.character_id;

-- 活跃会话视图
CREATE VIEW active_sessions AS
SELECT 
    session_id,
    scene_id,
    COUNT(*) as message_count,
    MIN(timestamp) as session_start,
    MAX(timestamp) as last_activity,
    ARRAY_AGG(DISTINCT character_id) as participants
FROM agent_logs
WHERE session_id IS NOT NULL
    AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY session_id, scene_id
ORDER BY last_activity DESC;

-- =============================================
-- 初始数据插入
-- =============================================

-- 创建默认场景
INSERT INTO scenes (id, name, description) VALUES 
('harbor_tavern', '港口酒馆', '一个充满各种旅行者和当地人的热闹酒馆'),
('market_square', '市场广场', '城市的商业中心，商人和顾客络绎不绝'),
('city_gates', '城门', '城市的入口，守卫森严');

-- 创建初始世界状态
INSERT INTO world_state (id, state_data) VALUES 
('global', '{"day": 1, "weather": "clear", "tension_level": 0.0}'),
('harbor_tavern', '{"crowd_level": "moderate", "noise_level": "high"}');

-- =============================================
-- 索引优化
-- =============================================

-- 为经常查询的字段创建索引
CREATE INDEX idx_characters_is_player ON characters(is_player);
CREATE INDEX idx_characters_is_active ON characters(is_active);
CREATE INDEX idx_belief_systems_character_id ON belief_systems(character_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_agent_logs_session_id ON agent_logs(session_id);

-- =============================================
-- 权限设置 (Supabase RLS)
-- =============================================

-- 启用行级安全
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE belief_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 创建策略 (允许服务角色完全访问)
CREATE POLICY "Service role can manage characters" ON characters
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage beliefs" ON belief_systems
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage logs" ON agent_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage events" ON events
    FOR ALL USING (auth.role() = 'service_role');