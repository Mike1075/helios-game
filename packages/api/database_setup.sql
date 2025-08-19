-- Helios Game 数据库初始化脚本
-- 创建游戏需要的所有表结构

-- 1. 角色表 (characters)
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    core_motivation TEXT NOT NULL,
    personality TEXT,
    is_player BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 信念系统表 (belief_systems)
CREATE TABLE IF NOT EXISTS belief_systems (
    id SERIAL PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id),
    belief_yaml TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- 3. 代理日志表 (agent_logs)
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    timestamp DOUBLE PRECISION NOT NULL,
    player_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    input TEXT,
    output TEXT,
    session_id TEXT,
    belief_influenced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 回响之室日志表 (echo_logs)
CREATE TABLE IF NOT EXISTS echo_logs (
    id SERIAL PRIMARY KEY,
    timestamp DOUBLE PRECISION NOT NULL,
    player_id TEXT NOT NULL,
    event_type TEXT DEFAULT 'echo_chamber',
    attribution TEXT NOT NULL,
    evidence JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 事件表 (events)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    timestamp DOUBLE PRECISION NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    player_id TEXT,
    scene_id TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 会话表 (sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    npc_id TEXT,
    scene_id TEXT DEFAULT 'tavern',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_agent_logs_player_id ON agent_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_echo_logs_player_id ON echo_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);
CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);

-- 插入初始NPC数据
INSERT INTO characters (id, name, role, core_motivation, personality, is_player) VALUES
('guard_alvin', '艾尔文', '城卫兵', '维护港口秩序，保护市民安全', '严谨、正直、略显刻板但内心善良', FALSE),
('wanderer_karin', '卡琳', '流浪者', '在这个充满敌意的世界中生存下去', '警觉、机智、表面冷漠但渴望被理解', FALSE),
('scholar_thane', '塞恩', '学者', '追寻古老的智慧与真理', '博学、好奇、有时过于沉迷于理论', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 插入NPC的初始信念系统
INSERT INTO belief_systems (character_id, belief_yaml) VALUES
('guard_alvin', '
worldview:
  - 秩序是社会安定的基础
  - 法律面前人人平等
  - 外来者需要格外关注
selfview:
  - 我有责任保护这里的民众
  - 我的职责就是我的荣誉
  - 我必须公正执法
values:
  - 正义高于个人感情
  - 职责比生命更重要
  - 秩序胜过混乱
'),
('wanderer_karin', '
worldview:
  - 世界对弱者充满恶意
  - 只能依靠自己才能生存
  - 信任别人就是自寻死路
selfview:
  - 我必须时刻保持警惕
  - 我没有朋友，只有利益
  - 我是个无家可归的流浪者
values:
  - 生存高于一切
  - 自由胜过安全
  - 独立比依赖更可靠
'),
('scholar_thane', '
worldview:
  - 知识是世界上最宝贵的财富
  - 真理往往隐藏在古老的文献中
  - 理解过去能预测未来
selfview:
  - 我是智慧的追求者
  - 我有义务传播知识
  - 我常常沉浸在思考中
values:
  - 智慧比财富更重要
  - 真理胜过方便的谎言
  - 学习是终生的使命
')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE characters IS '角色信息表，存储所有NPC和玩家角色的基础信息';
COMMENT ON TABLE belief_systems IS '信念系统表，存储角色的动态信念网络';
COMMENT ON TABLE agent_logs IS '代理日志表，记录所有对话和互动行为';
COMMENT ON TABLE echo_logs IS '回响之室日志表，记录所有主观归因分析';
COMMENT ON TABLE events IS '事件表，存储系统生成的各种游戏事件';
COMMENT ON TABLE sessions IS '会话表，跟踪玩家与NPC的对话会话';