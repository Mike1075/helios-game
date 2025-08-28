-- ========================================
-- 获取集体潜意识数据
-- ========================================
-- 
-- 用途: 替换 n8n 工作流中的"获取集体潜意识"节点
-- 原节点类型: n8n-nodes-base.supabaseTool (配置错误，表名应该是 collective_unconscious)
-- 新节点类型: n8n-nodes-base.postgres
-- 操作: Execute Query
-- 
-- 输入变量:
--   - 无需输入变量 (集体潜意识不依赖特定角色)
-- 
-- 输出字段:
--   - id: 集体潜意识记录ID
--   - content: 集体潜意识内容文本
--   - embedding: 向量嵌入(可选)
--   - created_at: 创建时间
-- 
-- 注意: 集体潜意识代表客观世界的规律，不需要 character_id 过滤
-- 
-- ========================================

SELECT 
    id,
    content,
    embedding,
    created_at
FROM collective_unconscious
ORDER BY created_at DESC;

-- ========================================
-- 可选: 如果需要基于用户输入进行相似性搜索
-- ========================================
-- 
-- 如果您的数据库中有向量嵌入，可以使用以下查询进行语义搜索:
-- 
-- SELECT 
--     id,
--     content,
--     embedding,
--     created_at,
--     1 - (embedding <=> '{{ $json.user_message_embedding }}') as similarity
-- FROM collective_unconscious
-- WHERE embedding IS NOT NULL
-- ORDER BY similarity DESC
-- LIMIT 5;
-- 
-- 注意: 这需要先将用户消息转换为向量嵌入

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 选择操作: "Execute Query"
-- 3. 复制上面的 SQL 查询到查询框
-- 4. 配置数据库连接: 使用现有的 Supabase 凭据
-- 5. 节点名称建议: "获取集体潜意识"
-- 6. 此节点可以独立运行，不依赖其他节点
-- 
-- 预期返回结果示例:
-- [
--   {
--     "id": 1,
--     "content": "重力让所有物体向下坠落",
--     "embedding": null,
--     "created_at": "2025-08-25T14:47:07.698Z"
--   },
--   {
--     "id": 2,
--     "content": "时间总是向前流逝",
--     "embedding": null,
--     "created_at": "2025-08-25T14:47:07.698Z"
--   }
-- ]
-- 
-- 在 LangChain Agent 中使用:
-- {{ $('获取集体潜意识').item.json.content }}
-- 或遍历所有集体潜意识:
-- {{ $('获取集体潜意识').all().map(item => item.json.content).join(', ') }}
-- 
-- ========================================
