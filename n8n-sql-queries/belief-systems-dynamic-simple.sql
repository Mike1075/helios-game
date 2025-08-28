-- ========================================
-- 获取信念系统 - 动态查询 (简化版)
-- ========================================

-- 硬编码版本 (已验证可用)
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems 
-- WHERE character_id = 'shy_student';

-- ========================================
-- 动态版本选项 (选择一个可用的)
-- ========================================

-- ✅ 可用的动态查询 (已测试)
SELECT id, content, embedding, character_id, created_at
FROM belief_systems
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- 其他选项 (不需要了)
-- 选项1: 从 Webhook 获取 (测试结果: undefined)
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $("Webhook").item.json.body.character_id }}';

-- 选项3: 从前置节点获取 (方括号引用)
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $["获取当前角色"].item.json.character_id }}';

-- 选项4: 从前置节点获取 (索引引用)
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $node[0].json.character_id }}';

-- ========================================
-- 使用步骤
-- ========================================
-- 1. 先用 test-dynamic-queries.sql 找到可用的 character_id 引用方式
-- 2. 取消注释对应的选项
-- 3. 注释掉其他选项
-- 4. 测试查询是否返回正确的信念数据
-- ========================================
