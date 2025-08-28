-- ========================================
-- 硬编码测试版本 - 所有查询
-- ========================================
-- 
-- 用于快速测试，避免节点引用问题
-- 使用固定的角色ID进行测试
-- 
-- 可用的角色ID:
-- - 'shy_student' (害羞学生)
-- - 'ambitious_worker' (雄心勃勃的工作者)
-- 
-- ========================================

-- ========================================
-- 1. 获取信念系统 (硬编码版本)
-- ========================================

SELECT 
    id,
    content,
    embedding,
    character_id,
    created_at
FROM belief_systems 
WHERE character_id = 'shy_student';

-- ========================================
-- 2. 获取内驱力 (硬编码版本)
-- ========================================

SELECT 
    id,
    content,
    embedding,
    character_id,
    created_at
FROM inner_drives 
WHERE character_id = 'shy_student';

-- ========================================
-- 3. 获取集体潜意识 (无需角色ID)
-- ========================================

SELECT 
    id,
    content,
    embedding,
    created_at
FROM collective_unconscious
ORDER BY created_at DESC;

-- ========================================
-- 4. 获取外我特征 - 行为 (硬编码版本)
-- ========================================

SELECT 
    id,
    content,
    embedding,
    character_id,
    created_at
FROM outer_self_traits 
WHERE character_id = 'shy_student';

-- ========================================
-- 5. 获取外我特征 - 反应 (硬编码版本)
-- ========================================

SELECT 
    id,
    content,
    embedding,
    character_id,
    created_at
FROM outer_self_traits 
WHERE character_id = 'shy_student';

-- ========================================
-- 切换角色测试
-- ========================================
-- 
-- 要测试不同角色，只需将上面所有查询中的 
-- 'shy_student' 替换为 'ambitious_worker'
-- 
-- 或者使用以下查询查看所有可用角色:
-- 
-- SELECT DISTINCT character_id, 
--        (SELECT name FROM characters WHERE id = character_id) as character_name
-- FROM belief_systems;
-- 
-- ========================================

-- ========================================
-- 使用步骤
-- ========================================
-- 
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 复制上面对应的查询
-- 3. 根据需要修改 character_id
-- 4. 测试查询是否返回数据
-- 5. 确认无误后再处理节点引用问题
-- 
-- ========================================
