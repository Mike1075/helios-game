-- 赫利俄斯港口酒馆 - Supabase数据库初始化脚本
-- 请在Supabase Dashboard的SQL Editor中运行此脚本

-- 1. 创建characters表
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    core_motivation TEXT NOT NULL,
    beliefs JSONB NOT NULL DEFAULT '{}',
    is_player BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建belief_systems表
CREATE TABLE IF NOT EXISTS belief_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
    worldview TEXT NOT NULL,
    selfview TEXT NOT NULL,
    values TEXT[] NOT NULL DEFAULT '{}',
    rules TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id)
);

-- 3. 创建agent_logs表
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL DEFAULT 'tavern_corner',
    action_type TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    belief_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建events表
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL DEFAULT 'tavern_corner',
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_characters_is_player ON characters(is_player);
CREATE INDEX IF NOT EXISTS idx_agent_logs_character_id ON agent_logs(character_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_scene_id ON agent_logs(scene_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_events_character_id ON events(character_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- 6. 插入预设的NPC角色数据
INSERT INTO characters (id, name, role, core_motivation, beliefs, is_player) VALUES
(
    'guard_elvin',
    '卫兵艾尔文',
    '港口卫兵',
    '维护港口秩序，保护无辜者',
    '{"worldview": "世界需要秩序来保护弱者", "selfview": "我是秩序的守护者", "values": ["维护秩序是最高职责", "保护无辜者是神圣使命"], "rules": ["当秩序与个人利益冲突时，选择秩序", "优先保护弱者和无辜者"]}',
    FALSE
),
(
    'priestess_lila',
    '祭司莉拉',
    '港口祭司',
    '传播信仰，帮助需要帮助的人',
    '{"worldview": "信仰能给人力量和希望", "selfview": "我是信仰的传播者和守护者", "values": ["信仰是心灵的支柱", "帮助他人是神圣的使命"], "rules": ["用信仰的力量帮助他人", "对所有人都要慈悲"]}',
    FALSE
),
(
    'merchant_karl',
    '商人卡尔',
    '港口商人',
    '寻找商机，获取利润',
    '{"worldview": "金钱是世界的驱动力", "selfview": "我是精明的商人", "values": ["利润至上", "信息就是财富"], "rules": ["永远寻找有利可图的交易", "保持商业机密"]}',
    FALSE
),
(
    'sailor_maya',
    '水手玛雅',
    '经验丰富的水手',
    '探索未知的海域，寻找冒险',
    '{"worldview": "大海蕴含着无限的可能", "selfview": "我是勇敢的探险者", "values": ["自由比安全更重要", "经验是最好的老师"], "rules": ["永远保持好奇心", "分享航海故事"]}',
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 7. 为每个NPC创建对应的信念系统记录
INSERT INTO belief_systems (character_id, worldview, selfview, values, rules) VALUES
(
    'guard_elvin',
    '世界需要秩序来保护弱者',
    '我是秩序的守护者',
    ARRAY['维护秩序是最高职责', '保护无辜者是神圣使命'],
    ARRAY['当秩序与个人利益冲突时，选择秩序', '优先保护弱者和无辜者']
),
(
    'priestess_lila',
    '信仰能给人力量和希望',
    '我是信仰的传播者和守护者',
    ARRAY['信仰是心灵的支柱', '帮助他人是神圣的使命'],
    ARRAY['用信仰的力量帮助他人', '对所有人都要慈悲']
),
(
    'merchant_karl',
    '金钱是世界的驱动力',
    '我是精明的商人',
    ARRAY['利润至上', '信息就是财富'],
    ARRAY['永远寻找有利可图的交易', '保持商业机密']
),
(
    'sailor_maya',
    '大海蕴含着无限的可能',
    '我是勇敢的探险者',
    ARRAY['自由比安全更重要', '经验是最好的老师'],
    ARRAY['永远保持好奇心', '分享航海故事']
)
ON CONFLICT (character_id) DO NOTHING;

-- 8. 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_belief_systems_updated_at BEFORE UPDATE ON belief_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建RLS策略（可选，用于生产环境）
-- ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE belief_systems ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 10. 创建视图用于查询玩家信念系统
CREATE OR REPLACE VIEW player_beliefs_view AS
SELECT 
    c.id as character_id,
    c.name,
    c.role,
    c.core_motivation,
    bs.worldview,
    bs.selfview,
    bs.values,
    bs.rules,
    c.created_at,
    bs.updated_at
FROM characters c
LEFT JOIN belief_systems bs ON c.id = bs.character_id
WHERE c.is_player = TRUE;

-- 11. 创建视图用于查询对话历史
CREATE OR REPLACE VIEW conversation_history_view AS
SELECT 
    al.id,
    al.character_id,
    c.name as character_name,
    al.scene_id,
    al.action_type,
    al.input,
    al.output,
    al.belief_snapshot,
    al.created_at
FROM agent_logs al
JOIN characters c ON al.character_id = c.id
ORDER BY al.created_at DESC;

-- 完成！现在您有了完整的数据库结构来支持信念系统和对话历史
