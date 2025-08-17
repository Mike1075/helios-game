-- ==========================================
-- Helios项目 "本我之境" - NPC信念系统数据库架构
-- 版本: v1.0
-- 创建日期: 2025-08-14
-- 兼容: PostgreSQL 14+ (Supabase)
-- 扩展需求: pgvector (向量存储)
-- ==========================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 核心NPC表
-- ==========================================

CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id VARCHAR(20) UNIQUE NOT NULL, -- 如 "npc_001"
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    type VARCHAR(50) NOT NULL, -- 人类适应者、原生AI等
    occupation VARCHAR(100),
    age VARCHAR(20), -- 支持 "3年(AI年龄)" 等格式
    gender VARCHAR(20),
    location VARCHAR(100),
    
    -- 外观描述
    avatar_description TEXT,
    
    -- 背景故事
    backstory_summary TEXT,
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 三层意识结构表
-- ==========================================

-- 核心驱动表 (本我)
CREATE TABLE core_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    drive_name VARCHAR(50) NOT NULL, -- "求知"、"守护"等
    description TEXT,
    strength DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0 强度
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 长期信念表 (自我)
CREATE TABLE long_term_beliefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    belief_text TEXT NOT NULL,
    strength DECIMAL(3,2) DEFAULT 1.0, -- 信念强度 0.0-1.0
    source VARCHAR(100), -- 信念来源 "initial"、"experience"等
    last_reinforced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 短期目标表 (超我)
CREATE TABLE short_term_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    priority INTEGER DEFAULT 5, -- 1-10 优先级
    status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
    deadline TIMESTAMP WITH TIME ZONE,
    progress DECIMAL(3,2) DEFAULT 0.0, -- 0.0-1.0 完成度
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 性格特征表
-- ==========================================

CREATE TABLE personality_traits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    trait_name VARCHAR(50) NOT NULL, -- rationality, empathy等
    value DECIMAL(3,2) NOT NULL, -- 0.0-1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(npc_id, trait_name)
);

-- ==========================================
-- 关系系统表
-- ==========================================

CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'npc' 或 'player'
    target_id VARCHAR(50) NOT NULL, -- NPC ID 或 Player ID
    relationship_weight INTEGER DEFAULT 0, -- -100 到 +100
    relationship_type VARCHAR(30), -- friend, enemy, neutral, romantic等
    last_interaction TIMESTAMP WITH TIME ZONE,
    total_interactions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(npc_id, target_type, target_id)
);

-- ==========================================
-- 记忆系统表
-- ==========================================

CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    memory_type VARCHAR(20) NOT NULL, -- conversation, event, observation
    content TEXT NOT NULL,
    importance_level CHAR(1) NOT NULL CHECK (importance_level IN ('S', 'A', 'B', 'C')),
    emotional_weight DECIMAL(3,2) DEFAULT 0.0, -- -1.0到1.0，负值为负面情绪
    
    -- 关联信息
    related_player_id VARCHAR(50),
    related_npc_id VARCHAR(20),
    location VARCHAR(100),
    
    -- 向量存储 (用于语义搜索)
    embedding VECTOR(1536), -- OpenAI embedding维度
    
    -- 时间信息
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 记忆衰减
    decay_rate DECIMAL(4,3) DEFAULT 0.1,
    current_strength DECIMAL(3,2) DEFAULT 1.0
);

-- 为向量搜索创建索引
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- 对话风格表
-- ==========================================

CREATE TABLE dialogue_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    style_name VARCHAR(50) NOT NULL, -- formality, technical_jargon等
    value DECIMAL(3,2) NOT NULL, -- 0.0-1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(npc_id, style_name)
);

-- ==========================================
-- 世界事件表
-- ==========================================

CREATE TABLE world_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(30) NOT NULL, -- social, technological, political等
    severity INTEGER DEFAULT 5, -- 1-10 事件严重性
    
    -- 时间信息
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_hours INTEGER,
    
    -- 影响范围
    global_impact BOOLEAN DEFAULT FALSE,
    affected_locations TEXT[], -- 数组存储受影响地点
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- NPC事件响应表
-- ==========================================

CREATE TABLE npc_event_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES world_events(id) ON DELETE CASCADE,
    
    -- 响应信息
    response_type VARCHAR(20) NOT NULL, -- ignore, observe, discuss, act, advocate
    response_intensity DECIMAL(3,2) DEFAULT 0.5, -- 0.0-1.0
    response_text TEXT,
    
    -- 信念影响
    belief_impact JSONB, -- 存储对各信念的影响
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(npc_id, event_id)
);

-- ==========================================
-- 信念变化日志表
-- ==========================================

CREATE TABLE belief_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    change_type VARCHAR(30) NOT NULL, -- core_drive, long_term_belief, short_term_goal
    old_value TEXT,
    new_value TEXT,
    trigger_type VARCHAR(50), -- SLE, belief_resonance, goal_completion等
    trigger_description TEXT,
    confidence DECIMAL(3,2) DEFAULT 1.0, -- 变化的确信度
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 玩家互动记录表
-- ==========================================

CREATE TABLE player_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id VARCHAR(50) NOT NULL,
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    
    -- 互动信息
    interaction_type VARCHAR(30) NOT NULL, -- conversation, action, gift等
    content TEXT,
    location VARCHAR(100),
    
    -- 情感分析
    player_sentiment DECIMAL(3,2), -- -1.0到1.0
    npc_sentiment DECIMAL(3,2),
    
    -- 关系影响
    relationship_change INTEGER DEFAULT 0, -- -10到+10
    
    -- 时间信息
    duration_seconds INTEGER,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 叙事传播表 (主观认知层)
-- ==========================================

CREATE TABLE narratives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    narrative_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- 基础信息
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    narrative_type VARCHAR(30) NOT NULL, -- official, rumor, news, gossip
    
    -- 来源信息
    source_type VARCHAR(20) NOT NULL, -- npc, system, player
    source_id VARCHAR(50),
    credibility DECIMAL(3,2) DEFAULT 0.5, -- 0.0-1.0
    
    -- 传播信息
    spread_count INTEGER DEFAULT 0,
    influence_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- 向量存储
    embedding VECTOR(1536),
    
    -- 关联的客观事件
    related_event_id UUID REFERENCES world_events(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 为叙事向量搜索创建索引
CREATE INDEX ON narratives USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- NPC叙事接收记录
-- ==========================================

CREATE TABLE npc_narrative_receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
    narrative_id UUID REFERENCES narratives(id) ON DELETE CASCADE,
    
    -- 接收信息
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reception_method VARCHAR(30), -- direct, indirect, overheard
    
    -- 认知滤镜处理结果
    interpreted_content TEXT, -- 经过认知滤镜处理后的内容
    emotional_reaction DECIMAL(3,2), -- -1.0到1.0
    credibility_assessment DECIMAL(3,2), -- 0.0-1.0
    personal_relevance DECIMAL(3,2), -- 0.0-1.0
    
    -- 是否触发信念共振
    triggered_resonance BOOLEAN DEFAULT FALSE,
    resonance_strength DECIMAL(3,2),
    
    UNIQUE(npc_id, narrative_id)
);

-- ==========================================
-- 索引优化
-- ==========================================

-- 性能优化索引
CREATE INDEX idx_npcs_active ON npcs(is_active);
CREATE INDEX idx_npcs_location ON npcs(location);
CREATE INDEX idx_memories_npc_importance ON memories(npc_id, importance_level);
CREATE INDEX idx_memories_occurred_at ON memories(occurred_at);
CREATE INDEX idx_relationships_npc ON relationships(npc_id);
CREATE INDEX idx_relationships_target ON relationships(target_type, target_id);
CREATE INDEX idx_player_interactions_player ON player_interactions(player_id);
CREATE INDEX idx_player_interactions_occurred ON player_interactions(occurred_at);
CREATE INDEX idx_narratives_type ON narratives(narrative_type);
CREATE INDEX idx_narratives_created ON narratives(created_at);

-- ==========================================
-- 触发器和函数
-- ==========================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_short_term_goals_updated_at BEFORE UPDATE ON short_term_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_traits_updated_at BEFORE UPDATE ON personality_traits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 视图定义
-- ==========================================

-- NPC完整信息视图
CREATE VIEW npc_full_profile AS
SELECT 
    n.*,
    array_agg(DISTINCT cd.drive_name) as core_drives,
    array_agg(DISTINCT ltb.belief_text) as long_term_beliefs,
    array_agg(DISTINCT stg.goal_text) as current_goals
FROM npcs n
LEFT JOIN core_drives cd ON n.id = cd.npc_id
LEFT JOIN long_term_beliefs ltb ON n.id = ltb.npc_id  
LEFT JOIN short_term_goals stg ON n.id = stg.npc_id AND stg.status = 'active'
WHERE n.is_active = true
GROUP BY n.id;

-- NPC关系网络视图
CREATE VIEW npc_relationship_network AS
SELECT 
    n1.name as npc_name,
    n1.npc_id,
    n2.name as related_name,
    r.target_id as related_npc_id,
    r.relationship_weight,
    r.relationship_type,
    r.total_interactions
FROM relationships r
JOIN npcs n1 ON r.npc_id = n1.id
LEFT JOIN npcs n2 ON r.target_id = n2.npc_id AND r.target_type = 'npc'
WHERE n1.is_active = true;

-- ==========================================
-- 初始化数据函数
-- ==========================================

-- 插入NPC数据的存储过程
CREATE OR REPLACE FUNCTION insert_npc_with_profile(
    p_npc_data JSONB
) RETURNS UUID AS $$
DECLARE
    v_npc_id UUID;
    v_trait JSONB;
    v_belief TEXT;
    v_goal TEXT;
    v_style JSONB;
BEGIN
    -- 插入基础NPC信息
    INSERT INTO npcs (
        npc_id, name, name_en, type, occupation, age, gender, location,
        avatar_description, backstory_summary
    ) VALUES (
        p_npc_data->>'id',
        p_npc_data->>'name',
        p_npc_data->>'name_en',
        p_npc_data->>'type',
        p_npc_data->>'occupation',
        p_npc_data->>'age',
        p_npc_data->>'gender',
        p_npc_data->>'location',
        p_npc_data->>'avatar_description',
        p_npc_data->>'backstory_summary'
    ) RETURNING id INTO v_npc_id;
    
    -- 插入核心驱动
    INSERT INTO core_drives (npc_id, drive_name, strength)
    VALUES (v_npc_id, p_npc_data->>'core_drive', 1.0);
    
    -- 插入长期信念
    FOR v_belief IN SELECT jsonb_array_elements_text(p_npc_data->'long_term_beliefs')
    LOOP
        INSERT INTO long_term_beliefs (npc_id, belief_text)
        VALUES (v_npc_id, v_belief);
    END LOOP;
    
    -- 插入短期目标
    FOR v_goal IN SELECT jsonb_array_elements_text(p_npc_data->'short_term_goals')
    LOOP
        INSERT INTO short_term_goals (npc_id, goal_text)
        VALUES (v_npc_id, v_goal);
    END LOOP;
    
    -- 插入性格特征
    FOR v_trait IN SELECT jsonb_each(p_npc_data->'personality_traits')
    LOOP
        INSERT INTO personality_traits (npc_id, trait_name, value)
        VALUES (v_npc_id, v_trait->>'key', (v_trait->>'value')::DECIMAL);
    END LOOP;
    
    -- 插入对话风格
    FOR v_style IN SELECT jsonb_each(p_npc_data->'dialogue_style')
    LOOP
        INSERT INTO dialogue_styles (npc_id, style_name, value)
        VALUES (v_npc_id, v_style->>'key', (v_style->>'value')::DECIMAL);
    END LOOP;
    
    RETURN v_npc_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 注释
-- ==========================================

COMMENT ON TABLE npcs IS 'NPC基础信息表';
COMMENT ON TABLE core_drives IS '核心驱动表 - 三层意识结构的本我层';
COMMENT ON TABLE long_term_beliefs IS '长期信念表 - 三层意识结构的自我层';  
COMMENT ON TABLE short_term_goals IS '短期目标表 - 三层意识结构的超我层';
COMMENT ON TABLE memories IS 'NPC记忆系统，支持向量语义搜索';
COMMENT ON TABLE narratives IS '叙事传播系统 - 主观认知层的信息载体';
COMMENT ON TABLE world_events IS '世界事件表 - 客观世界层的事实记录';

-- 数据库架构创建完成
-- 使用方法: 
-- 1. 运行此脚本创建完整架构
-- 2. 使用 insert_npc_with_profile() 函数批量导入NPC数据
-- 3. 使用视图查询NPC完整信息和关系网络
