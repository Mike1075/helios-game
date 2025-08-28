-- ========================================
-- 获取外我特征 (行为相关) - 动态查询
-- ========================================

-- ✅ 动态查询 (使用已验证的引用方式)
SELECT id, content, embedding, character_id, created_at
FROM outer_self_traits 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- 硬编码版本 (测试用)
-- SELECT id, content, embedding, character_id, created_at
-- FROM outer_self_traits 
-- WHERE character_id = 'shy_student';

-- ========================================
-- 使用说明
-- ========================================
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 选择操作: "Execute Query"
-- 3. 复制上面的动态查询
-- 4. 确保此节点连接在"获取当前角色"节点之后
-- 5. 节点名称建议: "获取外我特征-行为"
-- ========================================
