-- ========================================
-- 获取角色的外我特征数据 (行为相关)
-- ========================================
-- 
-- 用途: 替换 n8n 工作流中的"获取外我"节点
-- 原节点类型: n8n-nodes-base.supabaseTool (配置错误，表名应该是 outer_self_traits)
-- 新节点类型: n8n-nodes-base.postgres
-- 操作: Execute Query
-- 
-- 输入变量:
--   - character_id: 从"获取当前角色"节点获取
-- 
-- 输出字段:
--   - id: 外我特征记录ID
--   - content: 外我特征内容文本
--   - embedding: 向量嵌入(可选)
--   - character_id: 角色ID
--   - created_at: 创建时间
-- 
-- ========================================

-- 动态查询 (推荐)
SELECT
    id,
    content,
    embedding,
    character_id,
    created_at
FROM outer_self_traits
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- 硬编码查询 (测试用)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM outer_self_traits
-- WHERE character_id = 'shy_student';

-- ========================================
-- 可选: 如果需要筛选行为相关的外我特征
-- ========================================
-- 
-- 如果您想要更精确地筛选行为相关的外我特征，可以使用:
-- 
-- SELECT 
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM outer_self_traits 
-- WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}'
-- AND (
--     content ILIKE '%行为%' OR 
--     content ILIKE '%动作%' OR 
--     content ILIKE '%做%' OR
--     content ILIKE '%行动%'
-- );

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 选择操作: "Execute Query"
-- 3. 复制上面的 SQL 查询到查询框
-- 4. 配置数据库连接: 使用现有的 Supabase 凭据
-- 5. 节点名称建议: "获取外我(行为)"
-- 6. 确保此节点连接在"获取当前角色"节点之后
-- 
-- 预期返回结果示例:
-- [
--   {
--     "id": 1,
--     "content": "说话时会低头看地面",
--     "embedding": null,
--     "character_id": "shy_student",
--     "created_at": "2025-08-25T14:47:07.698Z"
--   },
--   {
--     "id": 2,
--     "content": "遇到陌生人会主动避开",
--     "embedding": null,
--     "character_id": "shy_student",
--     "created_at": "2025-08-25T14:47:07.698Z"
--   }
-- ]
-- 
-- 在 LangChain Agent 中使用:
-- {{ $('获取外我(行为)').item.json.content }}
-- 或遍历所有外我特征:
-- {{ $('获取外我(行为)').all().map(item => item.json.content).join(', ') }}
--
-- 故障排除:
-- 如果出现 "There is no connection back to the node" 错误:
-- 1. 确保前置节点名称为 "获取当前角色"
-- 2. 确保当前节点连接在 "获取当前角色" 节点之后
-- 3. 临时使用硬编码查询进行测试
-- 
-- ========================================
