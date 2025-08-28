-- ========================================
-- 获取集体无意识 - 动态查询
-- ========================================

-- ✅ 动态查询 (集体无意识不需要 character_id)
SELECT id, content, embedding, created_at
FROM collective_unconscious
ORDER BY created_at DESC;

-- 如果需要限制数量，可以添加 LIMIT
-- SELECT id, content, embedding, created_at
-- FROM collective_unconscious
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ========================================
-- 使用说明
-- ========================================
-- 1. 在 n8n 中创建 Postgres 节点
-- 2. 选择操作: "Execute Query"
-- 3. 复制上面的查询
-- 4. 集体无意识数据不依赖于特定角色，所以不需要连接在"获取当前角色"之后
-- 5. 节点名称建议: "获取集体无意识"
--
-- 注意: 集体无意识是所有角色共享的数据，不需要 character_id 过滤
--
-- ========================================
-- 在后续节点中正确引用集体无意识数据
-- ========================================
--
-- ❌ 错误的引用方式 (会显示 [object Object]):
-- {{ $("获取集体无意识") }}
--
-- ✅ 正确的引用方式:
--
-- 1. 获取所有集体无意识内容 (用逗号分隔):
-- {{ $("获取集体无意识").all().map(item => item.json.content).join(', ') }}
--
-- 2. 获取第一条集体无意识内容:
-- {{ $("获取集体无意识").first().json.content }}
--
-- 3. 获取所有集体无意识内容 (用换行分隔):
-- {{ $("获取集体无意识").all().map(item => item.json.content).join('\n') }}
--
-- 4. 获取前5条集体无意识内容:
-- {{ $("获取集体无意识").all().slice(0, 5).map(item => item.json.content).join(', ') }}
--
-- 5. 格式化输出 (包含ID和内容):
-- {{ $("获取集体无意识").all().map(item => `${item.json.id}: ${item.json.content}`).join('\n') }}
--
-- ========================================
