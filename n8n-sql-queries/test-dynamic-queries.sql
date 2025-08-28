-- ========================================
-- 找到正确的 character_id 引用方式
-- ========================================

-- 硬编码查询 (已验证可用)
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems
-- WHERE character_id = 'shy_student';

-- ========================================
-- 测试不同的 character_id 动态引用方式
-- ========================================

-- 测试1: 从 Webhook 获取 (如果前端直接传递)
SELECT '{{ $("Webhook").item.json.body.character_id }}' as test_character_id_1;

-- 测试2: 从前置节点获取 (标准引用)
SELECT '{{ $("获取当前角色").item.json.character_id }}' as test_character_id_2;

-- 测试3: 从前置节点获取 (方括号引用)
SELECT '{{ $["获取当前角色"].item.json.character_id }}' as test_character_id_3;

-- 测试4: 从前置节点获取 (索引引用)
SELECT '{{ $node[0].json.character_id }}' as test_character_id_4;

-- 测试5: 查看前置节点的完整输出 (调试用)
SELECT '{{ $("获取当前角色").item.json }}' as debug_previous_node;

-- ========================================
-- 使用说明
-- ========================================
--
-- 1. 逐个测试上面的 5 个查询
-- 2. 看哪个能返回正确的 character_id (比如 'shy_student')
-- 3. 找到可用的引用方式后，用它替换硬编码查询中的 'shy_student'
--
-- 例如，如果测试2可用，就用这个完整查询:
-- SELECT id, content, embedding, character_id, created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';
--
-- ========================================
