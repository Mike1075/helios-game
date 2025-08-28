-- ========================================
-- 获取角色的内驱力数据 (动态版本)
-- ========================================

-- 版本1: 标准节点引用
SELECT
    id,
    content,
    embedding,
    character_id,
    created_at
FROM inner_drives
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- 硬编码测试版本 (如果动态引用有问题)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM inner_drives
-- WHERE character_id = 'shy_student';

-- ========================================
-- 其他动态引用方式 (根据需要选择)
-- ========================================

-- 版本2: 使用不同的节点名称
-- WHERE character_id = '{{ $("您的实际节点名").item.json.character_id }}';

-- 版本3: 使用节点索引
-- WHERE character_id = '{{ $node[0].json.character_id }}';

-- 版本4: 从 webhook 直接获取
-- WHERE character_id = '{{ $json.body.character_id }}';

-- ========================================
