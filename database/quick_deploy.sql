
-- Helios Game 数据库表创建脚本
-- 请在Supabase Dashboard的SQL编辑器中执行

-- 1. 创建角色表
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    core_motivation TEXT NOT NULL,
    is_player BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avatar_url TEXT,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb
);

-- 2. 创建信念系统表
CREATE TABLE belief_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    belief_yaml TEXT NOT NULL,
    generation_count INTEGER DEFAULT 1,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id)
);

-- 3. 创建代理日志表
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    scene_id VARCHAR(100) DEFAULT 'harbor_tavern',
    action_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    belief_snapshot TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建事件表
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    trigger_character_id UUID REFERENCES characters(id),
    scene_id VARCHAR(100) DEFAULT 'harbor_tavern',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 5. 创建场景表
CREATE TABLE scenes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    atmosphere JSONB DEFAULT '{}'::jsonb,
    active_characters JSONB DEFAULT '[]'::jsonb,
    world_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 插入初始场景数据
INSERT INTO scenes (id, name, description, atmosphere) VALUES 
('harbor_tavern', '港口酒馆', '一个充满各种旅行者和当地人的热闹酒馆', '{"crowd_level": "moderate", "noise_level": "high"}'),
('market_square', '市场广场', '城市的商业中心，商人和顾客络绎不绝', '{"crowd_level": "high", "noise_level": "moderate"}'),
('city_gates', '城门', '城市的入口，守卫森严', '{"crowd_level": "low", "noise_level": "low"}');

-- 7. 插入示例NPC角色
INSERT INTO characters (id, name, role, core_motivation, is_player) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '艾尔文', '城市卫兵', '维护港口城市的秩序与安全，保护无辜市民', false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '卡琳', '流浪盗贼', '在城市中寻找生存机会，避免被当局发现', false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '塞拉斯', '酒馆老板', '经营酒馆获得利润，同时收集城市中的各种消息', false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '玛丽安', '治疗师', '帮助需要帮助的人，传播光明神的教义', false);

-- 8. 插入示例信念系统
INSERT INTO belief_systems (character_id, belief_yaml, confidence_score) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
'worldview:
  order_over_chaos:
    description: "秩序是文明的基石，混乱会带来痛苦"
    weight: 0.9
  authority_respect:
    description: "权威和法律应该得到尊重"
    weight: 0.8
selfview:
  duty_bound:
    description: "我有保护市民的神圣职责"
    weight: 0.9
values:
  justice: 0.9
  duty: 0.9
  protection: 0.8', 0.7);
