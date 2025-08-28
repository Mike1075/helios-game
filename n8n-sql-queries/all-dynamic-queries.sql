-- ========================================
-- 所有动态查询汇总
-- ========================================
-- 使用已验证的引用方式: $("获取当前角色").item.json.character_id
-- ========================================

-- ========================================
-- 1. 获取信念系统
-- ========================================
SELECT id, content, embedding, character_id, created_at
FROM belief_systems 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- ========================================
-- 2. 获取内驱力
-- ========================================
SELECT id, content, embedding, character_id, created_at
FROM inner_drives 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- ========================================
-- 3. 获取外我特征 (行为相关)
-- ========================================
SELECT id, content, embedding, character_id, created_at
FROM outer_self_traits 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- ========================================
-- 4. 获取外我特征 (反应相关)
-- ========================================
-- 注意: 这个和上面的查询相同，因为都是从 outer_self_traits 表获取
-- 在实际使用中，您可能需要根据 content 内容或其他字段来区分行为和反应
SELECT id, content, embedding, character_id, created_at
FROM outer_self_traits 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- ========================================
-- 5. 获取集体无意识 (不需要 character_id)
-- ========================================
SELECT id, content, embedding, created_at
FROM collective_unconscious
ORDER BY created_at DESC;

-- ========================================
-- n8n 工作流建议结构
-- ========================================
-- 
-- 1. Webhook 节点 (接收请求)
--    ↓
-- 2. "获取当前角色" 节点 (返回 character_id)
--    ↓
-- 3. "获取信念系统" 节点 (使用查询1)
--    ↓
-- 4. "获取内驱力" 节点 (使用查询2)
--    ↓
-- 5. "获取外我特征-行为" 节点 (使用查询3)
--    ↓
-- 6. "获取外我特征-反应" 节点 (使用查询4)
--    ↓
-- 7. "获取集体无意识" 节点 (使用查询5，可以并行)
--    ↓
-- 8. LangChain Agent 节点 (处理所有数据)
-- 
-- ========================================
-- 硬编码测试版本 (如果需要调试)
-- ========================================
-- 
-- SELECT * FROM belief_systems WHERE character_id = 'shy_student';
-- SELECT * FROM inner_drives WHERE character_id = 'shy_student';
-- SELECT * FROM outer_self_traits WHERE character_id = 'shy_student';
-- SELECT * FROM collective_unconscious LIMIT 10;
-- 
-- ========================================
