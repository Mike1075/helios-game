-- Helios Game 数据库手动修复脚本
-- 请在Supabase SQL编辑器中逐步执行以下SQL语句

-- ==================================================
-- 第一步：添加缺失的metadata字段到scene_events表
-- ==================================================
ALTER TABLE scene_events ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ==================================================
-- 第二步：修复character_states表的数据类型
-- ==================================================
-- 将整数类型修改为DECIMAL，允许存储小数
ALTER TABLE character_states ALTER COLUMN energy TYPE DECIMAL(5,2);
ALTER TABLE character_states ALTER COLUMN focus TYPE DECIMAL(5,2);
ALTER TABLE character_states ALTER COLUMN curiosity TYPE DECIMAL(5,2);
ALTER TABLE character_states ALTER COLUMN boredom TYPE DECIMAL(5,2);
ALTER TABLE character_states ALTER COLUMN anxiety TYPE DECIMAL(5,2);
ALTER TABLE character_states ALTER COLUMN suspicion TYPE DECIMAL(5,2);

-- ==================================================
-- 第三步：创建缺失的character_memories表
-- ==================================================
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

-- 为character_memories表创建索引
CREATE INDEX IF NOT EXISTS idx_character_memories_character_id ON character_memories(character_id);

-- ==================================================
-- 第四步：验证修复结果
-- ==================================================
-- 测试metadata字段
INSERT INTO scene_events (character_id, event_type, content, metadata) 
VALUES ('test', 'system', '测试metadata字段', '{"test": true}');

-- 测试DECIMAL数据类型
UPDATE character_states 
SET energy = 75.5, focus = 80.25, curiosity = 65.75
WHERE character_id = 'linxi';

-- 测试character_memories表
INSERT INTO character_memories (character_id, memory_type, content, emotional_weight) 
VALUES ('test', 'internal', '测试记忆表', 0.75);

-- ==================================================
-- 第五步：清理测试数据
-- ==================================================
DELETE FROM scene_events WHERE character_id = 'test';
DELETE FROM character_memories WHERE character_id = 'test';

-- ==================================================
-- 执行完成后的验证
-- ==================================================
-- 检查表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scene_events' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'character_states' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'character_memories' 
ORDER BY ordinal_position;

-- 检查现有数据
SELECT COUNT(*) as scene_events_count FROM scene_events;
SELECT COUNT(*) as character_states_count FROM character_states;
SELECT COUNT(*) as character_memories_count FROM character_memories;

-- 显示成功信息
SELECT 'Database schema fix completed successfully!' as status;