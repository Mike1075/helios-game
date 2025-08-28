-- ========================================
-- 获取角色的信念系统数据
-- ========================================
-- 
-- 用途: 替换 n8n 工作流中的"获取信念"节点
-- 原节点类型: n8n-nodes-base.supabaseTool
-- 新节点类型: n8n-nodes-base.postgres
-- 操作: Execute Query
-- 
-- 输入变量:
--   - character_id: 从"获取当前角色"节点获取
-- 
-- 输出字段:
--   - id: 信念记录ID
--   - content: 信念内容文本
--   - embedding: 向量嵌入(可选)
--   - character_id: 角色ID
--   - created_at: 创建时间
-- 
-- ========================================

-- ========================================
-- 动态查询选项 (请选择一个可用的版本)
-- ========================================

-- 版本1: 标准节点引用 (如果前置节点名为 "获取当前角色")
SELECT
    id,
    content,
    embedding,
    character_id,
    created_at
FROM belief_systems
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- 版本2: 使用方括号引用 (处理特殊字符)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $["获取当前角色"].item.json.character_id }}';

-- 版本3: 使用节点索引 (如果节点名称有问题)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $node[0].json.character_id }}';

-- 版本4: 从 webhook 直接获取 (如果前端直接传递 character_id)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $json.body.character_id }}';

-- 版本5: 使用 JSON 路径 (更安全的引用)
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM belief_systems
-- WHERE character_id = '{{ $("获取当前角色").item.json["character_id"] }}';

-- ========================================
-- 硬编码查询 (测试用 - 已验证可用)
-- ========================================
-- SELECT
--     id,
--     content,
--     embedding,
--     character_id,
--     created_at
-- FROM belief_systems
-- WHERE character_id = 'shy_student';

-- ========================================
-- 硬编码版本（用于测试）
-- ========================================
-- 如果节点引用有问题，可以使用以下硬编码版本进行测试：

-- 测试害羞学生角色:
-- WHERE character_id = 'shy_student';

-- 测试雄心勃勃的工作者角色:
-- WHERE character_id = 'ambitious_worker';

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 选择操作: "Execute Query"
-- 3. 复制上面的 SQL 查询到查询框
-- 4. 配置数据库连接: 使用现有的 Supabase 凭据
-- 5. 节点名称建议: "获取信念"
-- 6. 确保此节点连接在"获取当前角色"节点之后
-- 
-- 预期返回结果示例:
-- [
--   {
--     "id": 1,
--     "content": "我不配得到别人的关注",
--     "embedding": null,
--     "character_id": "shy_student",
--     "created_at": "2025-08-25T14:47:07.698Z"
--   },
--   {
--     "id": 2,
--     "content": "如果我说错话，别人会笑话我",
--     "embedding": null,
--     "character_id": "shy_student",
--     "created_at": "2025-08-25T14:47:07.698Z"
--   }
-- ]
-- 
-- 在 LangChain Agent 中使用:
-- {{ $('获取信念').item.json.content }}
-- 或遍历所有信念:
-- {{ $('获取信念').all().map(item => item.json.content).join(', ') }}
--
-- 故障排除:
-- 如果出现 "There is no connection back to the node" 错误:
-- 1. 确保前置节点名称为 "获取当前角色"
-- 2. 确保当前节点连接在 "获取当前角色" 节点之后
-- 3. 临时使用硬编码查询进行测试
-- 
-- ========================================
